/* ============================================================
   사운드 — BGM(main.ogg 루프) + 효과음(sword.ogg 공격)
   ============================================================ */
(function(){
  var G = window.G;
  G.audio = {
    bgm:null, sword:null, _started:false,

    init:function(){
      try{
        var bv=(G.state && G.state.bgmVol!=null)?G.state.bgmVol:0.32;
        var sv=(G.state && G.state.sfxVol!=null)?G.state.sfxVol:0.55;
        this.bgm = new Audio("assets/sound/main.ogg");
        this.bgm.loop = true; this.bgm.volume = bv; this.bgm.preload = "auto";
        this.sword = new Audio("assets/sound/sword.ogg");
        this.sword.volume = sv; this.sword.preload = "auto";
      }catch(e){}
    },

    /* 채널별 볼륨 설정(0~1) */
    setVol:function(which, v){
      v=Math.max(0, Math.min(1, v));
      if(which==="bgm"){ if(G.state) G.state.bgmVol=v; if(this.bgm) this.bgm.volume=v; }
      else if(which==="sfx"){ if(G.state) G.state.sfxVol=v; if(this.sword) this.sword.volume=v; }
      if(G.save) G.save.save(true);
    },

    isMuted:function(){ return !!(G.state && G.state.muted); },

    startBgm:function(){
      if(!this.bgm || this.isMuted()) return;
      var p=this.bgm.play(); if(p && p.catch) p.catch(function(){});   // 자동재생 차단 무시
    },
    stopBgm:function(){ if(this.bgm) this.bgm.pause(); },

    /* 효과음 — 빠른 연타 겹침 위해 복제 재생 */
    play:function(name){
      if(this.isMuted()) return;
      var src=this[name]; if(!src) return;
      try{ var s=src.cloneNode(); s.volume=src.volume; var p=s.play(); if(p && p.catch) p.catch(function(){}); }catch(e){}
    },

    toggleMute:function(){
      if(!G.state) return;
      G.state.muted = !G.state.muted;
      if(G.state.muted) this.stopBgm(); else this.startBgm();
      if(G.save) G.save.save(true);
    },

    /* 브라우저 자동재생 정책: 최초 사용자 상호작용에서 BGM 시작 */
    armAutostart:function(){
      var self=this;
      function go(){ if(self._started) return; self._started=true; self.startBgm();
        document.removeEventListener("pointerdown",go); document.removeEventListener("keydown",go); }
      document.addEventListener("pointerdown",go);
      document.addEventListener("keydown",go);
    }
  };
})();
