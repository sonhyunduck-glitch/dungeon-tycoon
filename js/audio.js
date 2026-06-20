/* ============================================================
   사운드 — Web Audio API 기반
   - BGM(main.ogg): 한 번 디코딩 후 메모리에서 무한 루프(gapless, 끊김 없음)
   - 효과음(sword.ogg): 디코딩된 버퍼를 매번 새 소스로 재생(겹침 OK)
   - HTMLAudioElement 스트리밍의 끊김/루프 갭 문제 회피
   ============================================================ */
(function(){
  var G = window.G;
  G.audio = {
    ctx:null, bgmGain:null, sfxGain:null,
    mainBuf:null, battleBuf:null, swordBuf:null,
    bgmSrc:null, _started:false, _wantBgm:false, _track:"main",   // _track: 현재 BGM(main=평상시 / battle=던전)

    init:function(){
      try{
        var AC = window.AudioContext || window.webkitAudioContext;
        if(!AC){ return; }
        this.ctx = new AC();
        var bv=(G.state && G.state.bgmVol!=null)?G.state.bgmVol:0.32;
        var sv=(G.state && G.state.sfxVol!=null)?G.state.sfxVol:0.55;
        this.bgmGain = this.ctx.createGain(); this.bgmGain.gain.value=bv; this.bgmGain.connect(this.ctx.destination);
        this.sfxGain = this.ctx.createGain(); this.sfxGain.gain.value=sv; this.sfxGain.connect(this.ctx.destination);
        this._load("assets/sound/main.ogg", "mainBuf", "main");
        this._load("assets/sound/battle.ogg", "battleBuf", "battle");
        this._load("assets/sound/sword.ogg", "swordBuf", null);
      }catch(e){ console.warn("[audio] init 실패",e); }
    },

    _load:function(url, field, bgmTrack){
      var self=this; if(!this.ctx) return;
      fetch(url).then(function(r){ return r.arrayBuffer(); })
        .then(function(ab){
          return new Promise(function(res,rej){
            // 콜백/프로미스 양쪽 호환
            var p=self.ctx.decodeAudioData(ab, res, rej);
            if(p && p.then) p.then(res, rej);
          });
        })
        .then(function(buf){ self[field]=buf; if(bgmTrack && self._wantBgm && self._track===bgmTrack && !self.bgmSrc) self.startBgm(); })
        .catch(function(e){ console.warn("[audio] load "+url, e); });
    },

    setVol:function(which, v){
      v=Math.max(0, Math.min(1, v));
      if(which==="bgm"){ if(G.state) G.state.bgmVol=v; if(this.bgmGain) this.bgmGain.gain.value=v; }
      else if(which==="sfx"){ if(G.state) G.state.sfxVol=v; if(this.sfxGain) this.sfxGain.gain.value=v; }
      if(G.save) G.save.save(true);
    },

    isMuted:function(){ return !!(G.state && G.state.muted); },

    _buf:function(){ return this._track==="battle" ? this.battleBuf : this.mainBuf; },
    startBgm:function(){
      if(this.isMuted() || !this.ctx){ return; }
      this._wantBgm=true;
      if(this.ctx.state==="suspended"){ try{ this.ctx.resume(); }catch(e){} }
      var buf=this._buf();
      if(!buf){ return; }                    // 아직 디코딩 전 — 완료 시 자동 시작
      if(this.bgmSrc){ return; }             // 이미 재생 중
      try{
        var src=this.ctx.createBufferSource();
        src.buffer=buf; src.loop=true;
        src.connect(this.bgmGain);
        src.start(0);
        this.bgmSrc=src;
      }catch(e){ console.warn("[audio] startBgm",e); }
    },
    stopBgm:function(){
      this._wantBgm=false;
      if(this.bgmSrc){ try{ this.bgmSrc.stop(); }catch(e){} try{ this.bgmSrc.disconnect(); }catch(e){} this.bgmSrc=null; }
    },
    _swap:function(){   // 현재 소스 정지 후 _track 버퍼로 재시작
      if(this.bgmSrc){ try{ this.bgmSrc.stop(); }catch(e){} try{ this.bgmSrc.disconnect(); }catch(e){} this.bgmSrc=null; }
      this.startBgm();
    },
    /* BGM 트랙 전환(main↔battle) — 짧은 페이드로 부드럽게 교체. 재생 중 아니면 트랙만 기억 */
    setTrack:function(key){
      key=(key==="battle")?"battle":"main";
      if(this._track===key) return;
      this._track=key;
      if(!this.ctx || this.isMuted() || !this._wantBgm){ return; }
      var self=this, g=this.bgmGain, ctx=this.ctx;
      var target=(G.state&&G.state.bgmVol!=null)?G.state.bgmVol:0.32;
      if(!g || !this.bgmSrc){ this._swap(); return; }
      try{ var t=ctx.currentTime; g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value,t); g.gain.linearRampToValueAtTime(0.0001, t+0.2); }catch(e){}
      setTimeout(function(){
        self._swap();
        try{ var t2=ctx.currentTime; g.gain.cancelScheduledValues(t2); g.gain.setValueAtTime(0.0001,t2); g.gain.linearRampToValueAtTime(target, t2+0.25); }
        catch(e){ if(g) g.gain.value=target; }
      }, 210);
    },
    /* 게임 상태에 맞는 BGM 자동 선택 — 던전 진행 중=battle, 그 외=main */
    syncBgm:function(){
      var r=G.state && G.state.dungeon && G.state.dungeon.run;
      var inDungeon=!!(r && !r.dead && !r.cleared);
      this.setTrack(inDungeon ? "battle" : "main");
    },

    /* 효과음 — 매번 새 소스(겹침 허용) */
    play:function(name){
      if(this.isMuted() || !this.ctx) return;
      var buf = (name==="sword") ? this.swordBuf : this[name+"Buf"];
      if(!buf) return;
      if(this.ctx.state==="suspended"){ try{ this.ctx.resume(); }catch(e){} }
      try{
        var src=this.ctx.createBufferSource();
        src.buffer=buf; src.connect(this.sfxGain); src.start(0);
      }catch(e){}
    },

    toggleMute:function(){
      if(!G.state) return;
      G.state.muted = !G.state.muted;
      if(G.state.muted) this.stopBgm(); else this.startBgm();
      if(G.save) G.save.save(true);
    },

    /* 브라우저 자동재생 정책: 최초 사용자 상호작용에서 ctx 재개 + BGM 시작 */
    armAutostart:function(){
      var self=this;
      function go(){
        if(self._started) return; self._started=true;
        if(self.ctx && self.ctx.state==="suspended"){ try{ self.ctx.resume(); }catch(e){} }
        self.startBgm();
        document.removeEventListener("pointerdown",go); document.removeEventListener("keydown",go);
      }
      document.addEventListener("pointerdown",go);
      document.addEventListener("keydown",go);
    }
  };
})();
