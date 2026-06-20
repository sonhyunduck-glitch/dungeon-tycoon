/* ============================================================
   네트워크 레이어 (Supabase) — 멀티플레이
   - 익명 로그인 + 닉네임
   - 클라우드 세이브 동기화
   - 실제 랭킹(프로필 floor)
   - 실시간 전역 채팅
   설정(js/supa_config.js)이 비어 있으면 모든 함수가 오프라인으로 graceful 동작.
   ============================================================ */
(function(){
  var G = window.G;
  G.net = {
    ready:false,     // 로그인 완료 + 사용 가능
    sb:null,
    uid:null,
    user:null,       // Supabase user 객체
    email:null,      // 이메일 계정이면 이메일, 게스트면 null
    nickname:null,
    _chatChan:null,
    _saveTimer:null,
  };

  G.net.configured = function(){
    return !!(window.SUPA && SUPA.url && SUPA.anonKey && window.supabase && window.supabase.createClient);
  };
  G.net.online = function(){ return !!(G.net.ready && G.net.sb); };

  /* ---------- 초기화: 클라이언트 + 익명 로그인 + 프로필 ---------- */
  G.net.init = async function(){
    if(!G.net.configured()){ console.info("[net] 오프라인 모드 (Supabase 미설정)"); return false; }
    try{
      G.net.sb = window.supabase.createClient(SUPA.url, SUPA.anonKey, {
        auth:{ persistSession:true, autoRefreshToken:true }
      });
      var sb=G.net.sb;
      var sess=(await sb.auth.getSession()).data.session;
      if(!sess){
        var si=await sb.auth.signInAnonymously();
        if(si.error) throw si.error;
      }
      var u=(await sb.auth.getUser()).data.user;
      if(!u){
        // 세션이 무효(계정 삭제/만료 등) → 기존 세션 정리 후 새 익명 로그인
        try{ await sb.auth.signOut(); }catch(e){}
        var si2=await sb.auth.signInAnonymously();
        if(si2.error) throw si2.error;
        u=(await sb.auth.getUser()).data.user;
      }
      if(!u) throw new Error("no user");
      G.net.uid=u.id;
      G.net.user=u;
      G.net.email=u.email||null;

      // 프로필(닉네임) 조회
      var pr=await sb.from("profiles").select("nickname,floor").eq("id",G.net.uid).maybeSingle();
      if(pr.data && pr.data.nickname){ G.net.nickname=pr.data.nickname; }
      G.net.ready=true;
      console.info("[net] 온라인. uid=",G.net.uid,"nick=",G.net.nickname);
      G.net.joinPresence();   // 실시간 접속자 집계 시작
      return true;
    }catch(e){
      console.warn("[net] 초기화 실패 → 오프라인:",e.message||e);
      G.net.ready=false; G.net.sb=null;
      return false;
    }
  };

  /* ---------- 닉네임 ---------- */
  G.net.hasNickname = function(){ return !!G.net.nickname; };
  // 반환: {ok:true} | {ok:false, msg}
  G.net.setNickname = async function(name){
    name=(name||"").trim().slice(0,16);
    if(!name) return { ok:false, msg:"닉네임을 입력하세요" };
    if(G.net.online()){
      // 중복 검사(대소문자 무시, 본인 제외). ilike로 후보 조회 후 JS에서 정확 비교(와일드카드 오탐 방지)
      try{
        var q=await G.net.sb.from("profiles").select("id,nickname").ilike("nickname", name);
        if(!q.error && q.data && q.data.some(function(row){
          return row.id!==G.net.uid && (row.nickname||"").toLowerCase()===name.toLowerCase();
        })) return { ok:false, msg:"이미 사용 중인 닉네임입니다" };
      }catch(e){ /* 조회 실패 시 차단하지 않고 통과(서버 제약이 최종 방어) */ }
    }
    G.net.nickname=name;
    if(G.state) G.state.nickname=name;
    if(!G.net.online()) return { ok:true };   // 오프라인이어도 로컬 닉네임은 유지
    try{
      var up=await G.net.sb.from("profiles").upsert({
        id:G.net.uid, nickname:name,
        floor:(G.state&&G.state.dungeon&&G.state.dungeon.maxFloor)||1,
        updated_at:new Date().toISOString()
      });
      if(up && up.error){   // DB unique 제약 위반 등(경합) → 중복 처리
        if(/duplicate|unique/i.test(up.error.message||"")) return { ok:false, msg:"이미 사용 중인 닉네임입니다" };
        return { ok:false, msg:"저장 실패" };
      }
      return { ok:true };
    }catch(e){ console.warn("[net] 닉네임 저장 실패",e); return { ok:false, msg:"저장 실패" }; }
  };

  /* ---------- 클라우드 세이브 ---------- */
  // 반환: {status:"found",data,at} | {status:"empty"} | {status:"error"} | {status:"offline"}
  // ※ 오류와 '데이터 없음'을 반드시 구분해야 함(오류를 빈 데이터로 오인하면 멀쩡한 클라우드를 덮어쓸 위험)
  G.net.pullSave = async function(){
    if(!G.net.online()) return { status:"offline" };
    try{
      var r=await G.net.sb.from("saves").select("data,updated_at").eq("user_id",G.net.uid).maybeSingle();
      if(r.error) return { status:"error" };
      if(r.data && r.data.data) return { status:"found", data:r.data.data, at:(Date.parse(r.data.updated_at)||0) };
      return { status:"empty" };
    }catch(e){ console.warn("[net] 세이브 불러오기 실패",e); return { status:"error" }; }
  };
  G.net.pushSave = async function(state){
    if(!G.net.online()) return false;
    try{
      await G.net.sb.from("saves").upsert({
        user_id:G.net.uid, data:state, updated_at:new Date().toISOString()
      });
      // 랭킹용 프로필 floor도 함께 갱신
      await G.net.syncProfile();
      return true;
    }catch(e){ console.warn("[net] 세이브 저장 실패",e); return false; }
  };
  // 디바운스 클라우드 저장(잦은 호출 방지)
  G.net.queueSave = function(){
    if(!G.net.online()) return;
    if(G.net._saveTimer) clearTimeout(G.net._saveTimer);
    G.net._saveTimer=setTimeout(function(){ G.net.pushSave(G.state); }, 4000);
  };
  // 대기 중인 디바운스 저장을 즉시 발화(앱 종료/백그라운드 전환 시 마지막 진행분 유실 방지)
  G.net.flushSave = function(){
    if(!G.net.online()) return;
    if(G.net._saveTimer){ clearTimeout(G.net._saveTimer); G.net._saveTimer=null; }
    try{ G.net.pushSave(G.state); }catch(e){}
  };

  /* ---------- 계정 (게스트 / 이메일) ---------- */
  // 현재 게스트(익명)인가?
  G.net.isGuest = function(){
    return !!(G.net.user && (G.net.user.is_anonymous || !G.net.user.email));
  };
  // 게스트 → 이메일 계정으로 전환(연동). uid 유지 → 진행도/랭킹 그대로.
  G.net.signUpEmail = async function(email, password){
    if(!G.net.online()) return { ok:false, msg:"오프라인 상태입니다" };
    email=(email||"").trim(); password=password||"";
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { ok:false, msg:"이메일 형식이 올바르지 않습니다" };
    if(password.length<6) return { ok:false, msg:"비밀번호는 6자 이상이어야 합니다" };
    try{
      var r=await G.net.sb.auth.updateUser({ email:email, password:password });
      if(r.error) return { ok:false, msg:r.error.message };
      var u=(await G.net.sb.auth.getUser()).data.user;
      G.net.user=u; G.net.email=u.email||email;
      // 메일 확인이 켜져 있으면 확인 전까지 email_confirmed_at 없음
      var needConfirm = !u.email;
      return { ok:true, needConfirm:needConfirm };
    }catch(e){ return { ok:false, msg:e.message||"전환 실패" }; }
  };
  // 기존 이메일 계정으로 로그인 (다른 기기에서 이어하기)
  G.net.loginEmail = async function(email, password){
    if(!G.net.online()) return { ok:false, msg:"오프라인 상태입니다" };
    email=(email||"").trim();
    try{
      var r=await G.net.sb.auth.signInWithPassword({ email:email, password:password });
      if(r.error) return { ok:false, msg:r.error.message };
      return { ok:true };
    }catch(e){ return { ok:false, msg:e.message||"로그인 실패" }; }
  };
  // 로그아웃 (다시 게스트로)
  G.net.logout = async function(){
    try{ await G.net.sb.auth.signOut(); }catch(e){}
  };

  /* ---------- 랭킹 / 프로필(아레나 포함) ---------- */
  G.net.syncProfile = async function(){
    if(!G.net.online() || !G.net.nickname) return;
    try{
      var row={
        id:G.net.uid, nickname:G.net.nickname,
        floor:(G.state&&G.state.dungeon&&G.state.dungeon.maxFloor)||1,
        updated_at:new Date().toISOString()
      };
      var base={ id:row.id, nickname:row.nickname, floor:row.floor, updated_at:row.updated_at };
      if(G.arena){   // 아레나 점수/전투력/스냅샷 함께 반영
        var a=G.state.arena||{score:1000,wins:0,losses:0};
        row.arena_score=a.score||1000; row.arena_wins=a.wins||0; row.arena_losses=a.losses||0;
        row.power=G.power(); row.snapshot=G.arena.snapshot();
      }
      var res=await G.net.sb.from("profiles").upsert(row);
      if(res && res.error){ await G.net.sb.from("profiles").upsert(base); }   // 아레나 컬럼 미존재 시 기본만(arena.sql 미실행 호환)
    }catch(e){ console.warn("[net] 프로필 동기화 실패",e); }
  };
  G.net.syncArena = function(){ return G.net.syncProfile(); };

  // 아레나 상대 추천(점수 근접) — 스냅샷 객체 배열 반환
  G.net.arenaOpponents = async function(){
    if(!G.net.online()) return [];
    try{
      var r=await G.net.sb.rpc("arena_opponents", { my_id:G.net.uid, my_score:(G.state.arena&&G.state.arena.score)||1000 });
      if(r.error || !r.data) return [];
      var minFloor=(G.arena&&G.arena.UNLOCK_FLOOR)||100;
      return r.data.filter(function(row){ return row.snapshot && (row.floor||0) >= minFloor; })   // 100층 미만 캐릭터는 상대로 제외
        .map(function(row){
          var s=row.snapshot||{};
          return Object.assign({}, s, { name:row.nickname, score:row.arena_score, power:row.power });
        });
    }catch(e){ console.warn("[net] 아레나 상대 조회 실패",e); return []; }
  };

  // 아레나 랭킹 뷰(점수 내림차순) — 상위3 + 내 주변
  G.net.arenaRanking = async function(){
    if(!G.net.online()) return null;
    try{
      var sb=G.net.sb, myScore=(G.state.arena&&G.state.arena.score)||1000;
      var cnt=await sb.from("profiles").select("id",{count:"exact",head:true});
      var total=cnt.count||0;
      var av=function(p){ return (p.snapshot&&p.snapshot.avatar)||"adventurer"; };
      var topR=await sb.from("profiles").select("nickname,arena_score,snapshot").order("arena_score",{ascending:false}).order("updated_at",{ascending:true}).limit(3);
      if(topR.error) return null;   // arena 컬럼 미존재 등 → 폴백(로컬 랭킹)
      var top=(topR.data||[]).map(function(p,i){ return { name:p.nickname, score:p.arena_score, rank:i+1, avatar:av(p) }; });
      var rr=await sb.rpc("my_rank_arena", { my_score:myScore });
      var myRank = (!rr.error && typeof rr.data==="number") ? rr.data : 1;
      var myIdx=myRank-1, start=(myIdx<=7)?3:(myIdx-5); start=Math.max(3,start);
      var arndR=await sb.from("profiles").select("nickname,arena_score,snapshot").order("arena_score",{ascending:false}).order("updated_at",{ascending:true}).range(start,start+9);
      var around=(arndR.data||[]).map(function(p,i){ return { name:p.nickname, score:p.arena_score, rank:start+i+1, me:(start+i+1)===myRank, avatar:av(p) }; });
      var myAv=(G.avatar&&G.avatar.currentId)?G.avatar.currentId():"adventurer";
      return { total:total, me:{ name:G.net.nickname||"나", score:myScore, rank:myRank, me:true, avatar:myAv }, top:top, around:around, gap:start>3 };
    }catch(e){ console.warn("[net] 아레나 랭킹 실패",e); return null; }
  };

  // 랭킹 뷰를 가져와 G.ranking.remoteView 에 캐시 후 재렌더
  G.net.refreshRanking = async function(){
    if(!G.net.online()) return null;
    try{
      var sb=G.net.sb;
      var myFloor=(G.state.dungeon.maxFloor)||1;
      // 총원
      var cnt=await sb.from("profiles").select("id",{count:"exact",head:true});
      var total=cnt.count||0;
      // 상위 3
      // 내 순위
      var myRank=1;
      var rr=await sb.rpc("my_rank",{ my_floor:myFloor });
      if(!rr.error && typeof rr.data==="number") myRank=rr.data;
      var av=function(p){ return (p.snapshot&&p.snapshot.avatar)||"adventurer"; };
      var topR=await sb.from("profiles").select("nickname,floor,snapshot").order("floor",{ascending:false}).order("updated_at",{ascending:true}).limit(3);
      var top=(topR.data||[]).map(function(p,i){ return { name:p.nickname, floor:p.floor, rank:i+1, me:(i+1)===myRank, avatar:av(p) }; });
      // 내 주변(위5·나·아래4) — 오프라인과 동일: 상위권이면 top3 뒤를 잇고, 아니면 내 주변
      var myIdx=myRank-1;                       // 0-based
      var start=(myIdx<=7)?3:(myIdx-5);
      start=Math.max(3,start);                  // top3와 겹치지 않게
      var end=start+9;                          // 10개(포함)
      var arndR=await sb.from("profiles").select("nickname,floor,snapshot").order("floor",{ascending:false}).order("updated_at",{ascending:true}).range(start,end);
      var around=(arndR.data||[]).map(function(p,i){
        return { name:p.nickname, floor:p.floor, rank:start+i+1, me:(start+i+1)===myRank, avatar:av(p) };
      });
      var myAv=(G.avatar&&G.avatar.currentId)?G.avatar.currentId():"adventurer";
      var me={ name:G.net.nickname||"나", floor:myFloor, rank:myRank, me:true, avatar:myAv };
      var gap = start>3;
      var view={ total:total, me:me, top:top, around:around, gap:gap, remote:true };
      G.ranking.remoteView=view;
      if(G.state.ui.tab==="ranking" && G.ui.renderRanking) G.ui.renderRanking();
      return view;
    }catch(e){ console.warn("[net] 랭킹 조회 실패",e); return null; }
  };

  /* ---------- 채팅 ---------- */
  G.net.chatHistory = async function(limit){
    if(!G.net.online()) return [];
    try{
      var r=await G.net.sb.from("messages").select("nickname,text,user_id,created_at")
              .order("created_at",{ascending:false}).limit(limit||40);
      return (r.data||[]).reverse().map(function(m){
        return { who:m.nickname, text:m.text, me:m.user_id===G.net.uid };
      });
    }catch(e){ console.warn("[net] 채팅 기록 실패",e); return []; }
  };
  G.net.chatSend = async function(text){
    if(!G.net.online()) return false;
    text=(text||"").trim().slice(0,200); if(!text) return false;
    try{
      await G.net.sb.from("messages").insert({
        user_id:G.net.uid, nickname:G.net.nickname||"익명", text:text
      });
      return true;
    }catch(e){ console.warn("[net] 메시지 전송 실패",e); return false; }
  };
  // 실시간 구독: onMsg({who,text,me})
  G.net.chatSubscribe = function(onMsg){
    if(!G.net.online()) return null;
    if(G.net._chatChan) return G.net._chatChan;
    try{
      G.net._chatChan=G.net.sb.channel("public:messages")
        .on("postgres_changes",{ event:"INSERT", schema:"public", table:"messages" }, function(payload){
          var m=payload.new;
          onMsg({ who:m.nickname, text:m.text, me:m.user_id===G.net.uid });
        })
        .subscribe();
      return G.net._chatChan;
    }catch(e){ console.warn("[net] 구독 실패",e); return null; }
  };
  G.net.chatUnsubscribe = function(){
    if(G.net._chatChan){ try{ G.net.sb.removeChannel(G.net._chatChan); }catch(e){} G.net._chatChan=null; }
  };

  /* ---------- 실시간 접속자(Presence) ---------- */
  G.net._presCount = 0;          // 현재 온라인 인원(고유 uid 수)
  G.net._onPresence = null;      // 변동 시 콜백(UI 갱신용)
  G.net.onlineCount = function(){ return G.net._presCount||0; };
  G.net.joinPresence = function(){
    if(!G.net.online() || G.net._presChan) return;
    try{
      var ch=G.net.sb.channel("presence:lobby", { config:{ presence:{ key:G.net.uid } } });
      ch.on("presence", { event:"sync" }, function(){
        var st=ch.presenceState();              // { uid: [meta,...], ... } → 키 수 = 고유 접속자
        G.net._presCount=Object.keys(st).length;
        if(typeof G.net._onPresence==="function") G.net._onPresence(G.net._presCount);
      }).subscribe(function(status){
        if(status==="SUBSCRIBED"){ try{ ch.track({ uid:G.net.uid, at:Date.now() }); }catch(e){} }
      });
      G.net._presChan=ch;
    }catch(e){ console.warn("[net] presence 실패",e); }
  };
})();
