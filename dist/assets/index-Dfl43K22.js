(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))s(r);new MutationObserver(r=>{for(const n of r)if(n.type==="childList")for(const o of n.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&s(o)}).observe(document,{childList:!0,subtree:!0});function t(r){const n={};return r.integrity&&(n.integrity=r.integrity),r.referrerPolicy&&(n.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?n.credentials="include":r.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function s(r){if(r.ep)return;r.ep=!0;const n=t(r);fetch(r.href,n)}})();const U={API_URL:"https://script.google.com/macros/s/AKfycbxo3CcWaKdFgRob-jyIwv359SDqWI2_nQc92SNlryqvPBXIrQtL4jJZORElseJqFmWB/exec"},C={username:"admin",password:"admin123"},u={LOGIN_SUCCESS:"Login realizado com sucesso!",LOGIN_ERROR:"Usuário ou senha incorretos.",TASK_CREATED:"Tarefa criada com sucesso!",TASK_COMPLETED:"Tarefa concluída!",REWARD_REDEEMED:"Prêmio resgatado!",INSUFFICIENT_POINTS:"Pontos insuficientes.",USER_CREATED:"Usuário criado com sucesso!",USER_UPDATED:"Usuário editado com sucesso!",USER_DELETED:"Usuário excluído com sucesso!",SHEET_STRUCTURED:"Planilha estruturada com sucesso!",GENERIC_ERROR:"Erro inesperado. Tente novamente."};class T{constructor(){this.state={user:null,userPoints:0,userType:null},this.listeners=new Set}getState(){return{...this.state}}setState(e){this.state={...this.state,...e},this.notifyListeners()}subscribe(e){return this.listeners.add(e),()=>this.listeners.delete(e)}notifyListeners(){this.listeners.forEach(e=>e(this.getState()))}login(e,t,s){this.setState({user:e,userPoints:t,userType:s})}loginAsAdmin(){const e={nome:C.username,senha:C.password,tipo:"Administrador",pontos:0};this.setState({user:e,userPoints:0,userType:"Administrador"})}logout(){this.setState({user:null,userPoints:0,userType:null})}updatePoints(e){this.setState({userPoints:e})}isLoggedIn(){return this.state.user!==null}isAdmin(){return this.state.userType==="Administrador"}getCurrentUser(){return this.state.user}getUserPoints(){return this.state.userPoints}}const d=new T;class R{constructor(){this.baseUrl=U.API_URL}async login(e,t){try{return await(await fetch(`${this.baseUrl}?action=login&name=${encodeURIComponent(e)}&password=${encodeURIComponent(t)}`)).json()}catch(s){throw console.error("API Login Error:",s),s}}async getTasks(){try{const t=await(await fetch(`${this.baseUrl}?action=getTasks`)).json();return Array.isArray(t)?t:[]}catch(e){throw console.error("API Get Tasks Error:",e),e}}async createTask(e,t,s,r){try{return await(await fetch(`${this.baseUrl}?action=createTask&title=${encodeURIComponent(e)}&description=${encodeURIComponent(t)}&points=${s}&creator=${encodeURIComponent(r)}`)).json()}catch(n){throw console.error("API Create Task Error:",n),n}}async concludeTask(e,t){try{return await(await fetch(`${this.baseUrl}?action=concludeTask&id=${e}&name=${encodeURIComponent(t)}`)).json()}catch(s){throw console.error("API Conclude Task Error:",s),s}}async getRewards(){try{const t=await(await fetch(`${this.baseUrl}?action=getRewards`)).json();return Array.isArray(t)?t:[]}catch(e){throw console.error("API Get Rewards Error:",e),e}}async redeemReward(e,t){try{return await(await fetch(`${this.baseUrl}?action=redeemReward&id=${e}&name=${encodeURIComponent(t)}`)).json()}catch(s){throw console.error("API Redeem Reward Error:",s),s}}async getRanking(){try{const t=await(await fetch(`${this.baseUrl}?action=getRanking`)).json();return Array.isArray(t)?t:t&&typeof t=="object"?t.success===!1?(console.error("Ranking API Error:",t.message),[]):t.data||t.ranking||[]:[]}catch(e){throw console.error("API Get Ranking Error:",e),e}}async getHistory(e){try{const s=await(await fetch(`${this.baseUrl}?action=getHistory&name=${encodeURIComponent(e)}`)).json();return Array.isArray(s)?s:[]}catch(t){throw console.error("API Get History Error:",t),t}}async getAllHistory(){try{const t=await(await fetch(`${this.baseUrl}?action=getAllHistory`)).json();return Array.isArray(t)?t:[]}catch(e){throw console.error("API Get All History Error:",e),e}}async getUsers(){try{return await(await fetch(`${this.baseUrl}?action=getUsers`)).json()}catch(e){throw console.error("API Get Users Error:",e),e}}async createUser(e){try{return await(await fetch(`${this.baseUrl}?action=createUser&name=${encodeURIComponent(e.nome)}&password=${encodeURIComponent(e.senha)}&type=${encodeURIComponent(e.tipo)}&points=${e.pontos}`)).json()}catch(t){throw console.error("API Create User Error:",t),t}}async updateUser(e,t){try{return await(await fetch(`${this.baseUrl}?action=editUser&userId=${encodeURIComponent(e)}&name=${encodeURIComponent(t.nome)}&password=${encodeURIComponent(t.senha)}&type=${encodeURIComponent(t.tipo)}&points=${t.pontos}`)).json()}catch(s){throw console.error("API Update User Error:",s),s}}async deleteUser(e){try{return await(await fetch(`${this.baseUrl}?action=deleteUser&userId=${encodeURIComponent(e)}`)).json()}catch(t){throw console.error("API Delete User Error:",t),t}}async structureSheet(){try{return await(await fetch(`${this.baseUrl}?action=estruturarPlanilha`)).json()}catch(e){throw console.error("API Structure Sheet Error:",e),e}}}const m=new R;function w(i,e){return i.trim()?null:`${e} é obrigatório.`}function L(i){const e=parseInt(i);return isNaN(e)||e<0?"Os pontos devem ser um número maior ou igual a zero.":null}function $(i){const e=parseInt(i);return isNaN(e)||e<1?"Os pontos devem ser um número maior que zero.":null}function l(i){const e=document.createElement("div");return e.textContent=i,e.innerHTML}function g(i,e){const t=i.textContent||"",s=i.disabled;return i.textContent=e,i.disabled=!0,()=>{i.textContent=t,i.disabled=s}}class I{constructor(e){this.container=e,this.render(),this.setupEventListeners()}render(){this.container.innerHTML=`
      <div class="login-container">
        <div class="login-form">
          <h1>Sistema de Gamificação</h1>
          <div class="form-group">
            <label for="login-username">Usuário:</label>
            <input type="text" id="login-username" placeholder="Digite seu usuário" />
          </div>
          <div class="form-group">
            <label for="login-password">Senha:</label>
            <input type="password" id="login-password" placeholder="Digite sua senha" />
          </div>
          <button id="login-button" class="btn btn-primary">Entrar</button>
          <div id="login-error" class="error-message"></div>
        </div>
      </div>
    `}setupEventListeners(){const e=this.container.querySelector("#login-username"),t=this.container.querySelector("#login-password"),s=this.container.querySelector("#login-button");[e,t].forEach(r=>{r.addEventListener("keypress",n=>{n.key==="Enter"&&this.handleLogin()})}),s.addEventListener("click",()=>this.handleLogin())}async handleLogin(){const e=this.container.querySelector("#login-username"),t=this.container.querySelector("#login-password"),s=this.container.querySelector("#login-button"),r=this.container.querySelector("#login-error"),n=e.value.trim(),o=t.value.trim();r.textContent="";const a=w(n,"Usuário"),h=w(o,"Senha");if(a||h){r.textContent=a||h||"";return}const p=g(s,"🔄 Entrando...");try{if(n===C.username&&o===C.password){d.loginAsAdmin();return}const c=await m.login(n,o);if(c.success){const y={nome:n,senha:o,tipo:c.tipo||"Usuário",pontos:c.pontos||0};d.login(y,c.pontos||0,y.tipo)}else r.textContent=u.LOGIN_ERROR}catch(c){console.error("Login error:",c),r.textContent=u.GENERIC_ERROR}finally{p()}}clearForm(){const e=this.container.querySelector("#login-username"),t=this.container.querySelector("#login-password"),s=this.container.querySelector("#login-error");e.value="",t.value="",s.textContent=""}}class A{constructor(e){this.container=e,this.tasks=[],this.render(),this.setupEventListeners(),this.loadTasks()}render(){const t=d.getState().userType==="Administrador";this.container.innerHTML=`
      ${t?`
        <div class="task-form">
          <h4>➕ Criar Nova Tarefa</h4>
          <div class="form-group">
            <input type="text" id="new-task-title" placeholder="Título da tarefa" />
          </div>
          <div class="form-group">
            <textarea id="new-task-description" placeholder="Descrição da tarefa"></textarea>
          </div>
          <div class="form-group">
            <input type="number" id="new-task-points" placeholder="Pontos" min="1" />
          </div>
          <button id="create-task-button" class="btn btn-primary">Criar Tarefa</button>
          <div id="task-form-error" class="error-message"></div>
        </div>
      `:""}
      
      <div id="task-list" class="task-list">
        <div class="loading">Carregando tarefas...</div>
      </div>
    `}setupEventListeners(){if(d.getState().userType==="Administrador"){const t=this.container.querySelector("#create-task-button");t==null||t.addEventListener("click",()=>this.handleCreateTask());const s=this.container.querySelector("#new-task-title"),r=this.container.querySelector("#new-task-points");[s,r].forEach(n=>{n==null||n.addEventListener("keypress",o=>{o.key==="Enter"&&this.handleCreateTask()})})}}async handleCreateTask(){const e=this.container.querySelector("#new-task-title"),t=this.container.querySelector("#new-task-description"),s=this.container.querySelector("#new-task-points"),r=this.container.querySelector("#create-task-button"),n=this.container.querySelector("#task-form-error"),o=e.value.trim(),a=t.value.trim(),h=s.value.trim();n.textContent="";const p=w(o,"Título"),c=w(a,"Descrição"),y=$(h);if(p||c||y){n.textContent=p||c||y||"";return}const E=d.getState();if(!E.user)return;const S=g(r,"🔄 Criando...");try{const v=await m.createTask(o,a,parseInt(h),E.user.nome);v.success?(e.value="",t.value="",s.value="",await this.loadTasks(),this.showSuccessMessage(u.TASK_CREATED)):n.textContent=v.message||"Erro ao criar tarefa."}catch(v){console.error("Create task error:",v),n.textContent=u.GENERIC_ERROR}finally{S()}}async handleConcludeTask(e,t){const s=d.getState();if(!s.user)return;const r=this.container.querySelector(`[data-task-id="${e}"]`);if(!r)return;const n=g(r,"🔄 Concluindo...");try{const o=await m.concludeTask(e,s.user.nome);if(o.success){const a=s.userPoints+t;d.updatePoints(a),await this.loadTasks(),this.showSuccessMessage(u.TASK_COMPLETED)}else alert(o.message||"Erro ao concluir tarefa.")}catch(o){console.error("Conclude task error:",o),alert(u.GENERIC_ERROR)}finally{n()}}async loadTasks(){const e=this.container.querySelector("#task-list");try{this.tasks=await m.getTasks(),this.renderTasks()}catch(t){console.error("Load tasks error:",t),e.innerHTML='<div class="error">Erro ao carregar tarefas.</div>'}}renderTasks(){const e=this.container.querySelector("#task-list"),s=d.getState().userType==="Administrador";if(this.tasks.length===0){e.innerHTML='<div class="empty">Nenhuma tarefa disponível.</div>';return}e.innerHTML=this.tasks.map(r=>`
      <div class="task-item">
        <div class="task-header">
          <h4>${l(r.titulo)}</h4>
          <span class="task-points">${r.pontos} pts</span>
        </div>
        <div class="task-description">
          ${l(r.descricao)}
        </div>
        ${s?`
          <div class="task-creator">
            <small>Criado por: ${l(r.criador||"Sistema")}</small>
          </div>
        `:`
          <div class="task-actions">
            <button 
              class="btn btn-success" 
              data-task-id="${r.id}"
              onclick="window.taskComponent.concludeTask('${r.id}', ${r.pontos})"
            >
              ✅ Concluir
            </button>
          </div>
        `}
      </div>
    `).join(""),window.taskComponent={concludeTask:(r,n)=>this.handleConcludeTask(r,n)}}showSuccessMessage(e){const t=this.container.querySelector("#task-list"),s=document.createElement("div");s.className="success-message",s.textContent=e,t.prepend(s),setTimeout(()=>{s.remove()},3e3)}refresh(){this.loadTasks()}}class q{constructor(e){this.container=e,this.rewards=[],this.render(),this.loadRewards()}render(){this.container.innerHTML=`
      <div id="rewards-list" class="rewards-list">
        <div class="loading">Carregando prêmios...</div>
      </div>
    `}async handleRedeemReward(e,t){const s=d.getState();if(!s.user)return;if(s.userPoints<t){alert(u.INSUFFICIENT_POINTS);return}const r=this.container.querySelector(`[data-reward-id="${e}"]`);if(!r)return;const n=g(r,"🔄 Resgatando...");try{const o=await m.redeemReward(e,s.user.nome);if(o.success){const a=s.userPoints-t;d.updatePoints(a),this.showSuccessMessage(u.REWARD_REDEEMED)}else alert(o.message||"Erro ao resgatar prêmio.")}catch(o){console.error("Redeem reward error:",o),alert(u.GENERIC_ERROR)}finally{n()}}async loadRewards(){const e=this.container.querySelector("#rewards-list");try{this.rewards=await m.getRewards(),this.renderRewards()}catch(t){console.error("Load rewards error:",t),e.innerHTML='<div class="error">Erro ao carregar prêmios.</div>'}}renderRewards(){const e=this.container.querySelector("#rewards-list"),t=d.getState(),s=t.userType==="Administrador";if(this.rewards.length===0){e.innerHTML='<div class="empty">Nenhum prêmio disponível.</div>';return}e.innerHTML=this.rewards.map(r=>{const n=t.userPoints>=r.custo;return`
        <div class="reward-item ${!n&&!s?"unavailable":""}">
          <div class="reward-header">
            <h4>${l(r.nome)}</h4>
            <span class="reward-cost">${r.custo} pts</span>
          </div>
          <div class="reward-description">
            ${l(r.descricao)}
          </div>
          ${s?"":`
            <div class="reward-actions">
              <button 
                class="btn ${n?"btn-primary":"btn-disabled"}" 
                data-reward-id="${r.id}"
                ${n?"":"disabled"}
                onclick="window.rewardsComponent.redeemReward('${r.id}', ${r.custo})"
              >
                ${n?"🎁 Resgatar":"🔒 Pontos insuficientes"}
              </button>
            </div>
          `}
        </div>
      `}).join(""),window.rewardsComponent={redeemReward:(r,n)=>this.handleRedeemReward(r,n)}}showSuccessMessage(e){const t=this.container.querySelector("#rewards-list"),s=document.createElement("div");s.className="success-message",s.textContent=e,t.prepend(s),setTimeout(()=>{s.remove()},3e3)}refresh(){this.loadRewards()}}class P{constructor(e){this.container=e,this.ranking=[],this.render(),this.loadRanking()}render(){this.container.innerHTML=`
      <div id="ranking-list" class="ranking-list">
        <div class="loading">Carregando ranking...</div>
      </div>
    `}async loadRanking(){const e=this.container.querySelector("#ranking-list");try{this.ranking=await m.getRanking(),this.renderRanking()}catch(t){console.error("Load ranking error:",t),e.innerHTML='<div class="error">Erro ao carregar ranking.</div>'}}renderRanking(){var n;const e=this.container.querySelector("#ranking-list"),t=d.getState(),s=(n=t.user)==null?void 0:n.nome,r=t.userType==="Administrador";if(this.ranking.length===0){e.innerHTML='<div class="empty">Nenhum usuário encontrado no ranking.</div>';return}e.innerHTML=this.ranking.map((o,a)=>{const h=o.nome===s&&!r,p=a+1;let c="",y="";return p===1?(c='<span class="ranking-badge gold">🥇</span>',y="top-1"):p===2?(c='<span class="ranking-badge silver">🥈</span>',y="top-2"):p===3&&(c='<span class="ranking-badge bronze">🥉</span>',y="top-3"),`
        <div class="ranking-item ${y} ${h?"current-user":""}">
          <div class="ranking-position">#${p}</div>
          <div class="ranking-name">
            ${l(o.nome)}${h?" (Você)":""}
          </div>
          <div class="ranking-points">${o.pontos} pts</div>
          ${c}
        </div>
      `}).join("")}refresh(){this.loadRanking()}}class D{constructor(e){this.container=e,this.history=[],this.render(),this.loadHistory()}render(){this.container.innerHTML=`
      <div id="history-list" class="history-list">
        <div class="loading">Carregando histórico...</div>
      </div>
    `}async loadHistory(){const e=this.container.querySelector("#history-list"),t=d.getState();if(t.user)try{t.userType==="Administrador"?this.history=await m.getAllHistory():this.history=await m.getHistory(t.user.nome),this.renderHistory()}catch(s){console.error("Load history error:",s),e.innerHTML='<div class="error">Erro ao carregar histórico.</div>'}}renderHistory(){const e=this.container.querySelector("#history-list"),s=d.getState().userType==="Administrador";if(this.history.length===0){e.innerHTML='<div class="empty">Nenhuma atividade encontrada.</div>';return}e.innerHTML=this.history.map(r=>{const n=r.tipo==="Tarefa Concluída"?"✅":"🎁";return`
        <div class="history-item ${s?"admin-history":""}">
          ${s?`
            <div class="history-header">
              <strong>${l(r.usuario)}</strong>
              <span class="history-date">${l(r.data)}</span>
            </div>
            <div class="history-content">
              ${n} ${l(r.tipo)}: ${l(r.descricao)} 
              <span class="history-points">(${r.pontos})</span>
            </div>
          `:`
            <div class="history-single">
              <span class="history-date">${l(r.data)}</span>
              <span class="history-separator">—</span>
              <span class="history-type">${n} ${l(r.tipo)}</span>
              <span class="history-separator">—</span>
              <span class="history-description">${l(r.descricao)}</span>
              <span class="history-points">(${r.pontos})</span>
            </div>
          `}
        </div>
      `}).join("")}refresh(){this.loadHistory()}}class M{constructor(e){this.container=e,this.users=[],this.currentFormMode="create",this.currentEditUserId=null,this.render(),this.setupEventListeners(),this.loadUsers()}render(){this.container.innerHTML=`
      <div class="admin-panel-content">
        <h3>👨‍💼 Painel Administrativo</h3>
        
        <div class="admin-section">
          <div class="admin-actions">
            <button id="show-user-form-button" class="btn btn-primary">➕ Criar Usuário</button>
            <button id="refresh-users-button" class="btn btn-secondary">🔄 Atualizar Lista</button>
          </div>
        </div>

        <div id="user-form" class="user-form" style="display: none;">
          <div class="form-header">
            <h4 id="user-form-title">Criar Novo Usuário</h4>
            <button id="cancel-user-form" class="btn btn-link">✖️ Cancelar</button>
          </div>
          
          <div class="form-grid">
            <div class="form-group">
              <label for="form-user-name">Nome do Usuário:</label>
              <input type="text" id="form-user-name" placeholder="Digite o nome" />
            </div>
            
            <div class="form-group">
              <label for="form-user-password">Senha:</label>
              <input type="password" id="form-user-password" placeholder="Digite a senha" />
            </div>
            
            <div class="form-group">
              <label for="form-user-type">Tipo:</label>
              <select id="form-user-type">
                <option value="Usuário">Usuário</option>
                <option value="Administrador">Administrador</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="form-user-points">Pontos:</label>
              <input type="number" id="form-user-points" placeholder="0" min="0" />
            </div>
          </div>
          
          <div class="form-actions">
            <button id="save-user-button" class="btn btn-success">💾 Salvar</button>
          </div>
          
          <div id="user-form-error" class="error-message"></div>
          <input type="hidden" id="edit-user-id" />
        </div>

        <div class="admin-section">
          <h4>👥 Usuários Cadastrados</h4>
          <div id="users-list" class="users-list">
            <div class="loading">Carregando usuários...</div>
          </div>
        </div>
      </div>
    `}setupEventListeners(){this.container.querySelector("#show-user-form-button").addEventListener("click",()=>this.showUserForm("create")),this.container.querySelector("#refresh-users-button").addEventListener("click",()=>this.loadUsers()),this.container.querySelector("#cancel-user-form").addEventListener("click",()=>this.hideUserForm()),this.container.querySelector("#save-user-button").addEventListener("click",()=>this.handleSaveUser()),this.container.querySelectorAll("#user-form input").forEach(o=>{o.addEventListener("keypress",a=>{a.key==="Enter"&&this.handleSaveUser()})})}showUserForm(e,t=null){const s=this.container.querySelector("#user-form"),r=this.container.querySelector("#user-form-title"),n=this.container.querySelector("#form-user-name"),o=this.container.querySelector("#form-user-password"),a=this.container.querySelector("#form-user-type"),h=this.container.querySelector("#form-user-points"),p=this.container.querySelector("#edit-user-id"),c=this.container.querySelector("#user-form-error");this.currentFormMode=e,c.textContent="",e==="create"?(r.textContent="Criar Novo Usuário",n.value="",o.value="",a.value="Usuário",h.value="0",p.value="",this.currentEditUserId=null):e==="edit"&&t&&(r.textContent="Editar Usuário",n.value=t.nome,o.value=t.senha,a.value=t.tipo,h.value=t.pontos.toString(),p.value=t.id||"",this.currentEditUserId=t.id||null),s.style.display="block",n.focus()}hideUserForm(){const e=this.container.querySelector("#user-form");e.style.display="none",this.currentFormMode="create",this.currentEditUserId=null}async handleSaveUser(){const e=this.container.querySelector("#form-user-name"),t=this.container.querySelector("#form-user-password"),s=this.container.querySelector("#form-user-type"),r=this.container.querySelector("#form-user-points"),n=this.container.querySelector("#save-user-button"),o=this.container.querySelector("#user-form-error"),a=e.value.trim(),h=t.value.trim(),p=s.value,c=r.value.trim();o.textContent="";const y=w(a,"Nome"),E=w(h,"Senha"),S=L(c);if(y||E||S){o.textContent=y||E||S||"";return}const v={nome:a,senha:h,tipo:p,pontos:parseInt(c)},b=g(n,"🔄 Salvando...");try{let f;if(this.currentFormMode==="create")f=await m.createUser(v);else{if(!this.currentEditUserId)throw new Error("ID do usuário não encontrado");v.id=this.currentEditUserId,f=await m.updateUser(this.currentEditUserId,v)}if(f.success){this.hideUserForm(),await this.loadUsers();const k=this.currentFormMode==="create"?u.USER_CREATED:u.USER_UPDATED;this.showSuccessMessage(k)}else o.textContent=f.message||"Erro ao salvar usuário."}catch(f){console.error("Save user error:",f),o.textContent=u.GENERIC_ERROR}finally{b()}}async handleDeleteUser(e,t){if(!confirm(`Tem certeza que deseja excluir o usuário "${t}"?

Esta ação não pode ser desfeita.`))return;const s=this.container.querySelector(`[data-delete-user="${e}"]`);if(!s)return;const r=g(s,"🔄 Excluindo...");try{const n=await m.deleteUser(e);n.success?(await this.loadUsers(),this.showSuccessMessage(u.USER_DELETED)):alert(n.message||"Erro ao excluir usuário.")}catch(n){console.error("Delete user error:",n),alert(u.GENERIC_ERROR)}finally{r()}}async handleStructureSheet(){const e=this.container.querySelector("#structure-sheet-button");if(!e)return;const t=g(e,"🔄 Estruturando...");try{const s=await m.structureSheet();s.success?(alert(`✅ ${u.SHEET_STRUCTURED}

${s.message}`),await this.loadUsers()):alert(`❌ Erro ao estruturar planilha:

${s.message}`)}catch(s){console.error("Structure sheet error:",s),alert("❌ Erro ao estruturar planilha. Verifique o console para mais detalhes.")}finally{t()}}async loadUsers(){var t;const e=this.container.querySelector("#users-list");try{const s=await m.getUsers();if(!s.success&&((t=s.message)!=null&&t.includes("não encontrada"))){e.innerHTML=`
          <div class="sheet-setup-warning">
            <h4>⚠️ Planilha Não Configurada</h4>
            <p>A estrutura da planilha precisa ser criada.</p>
            <button id="structure-sheet-button" class="btn btn-primary">
              🛠️ Estruturar Planilha Automaticamente
            </button>
          </div>
        `;const r=e.querySelector("#structure-sheet-button");r==null||r.addEventListener("click",()=>this.handleStructureSheet());return}this.users=Array.isArray(s)?s:s.data||[],this.renderUsers()}catch(s){console.error("Load users error:",s),e.innerHTML='<div class="error">Erro ao carregar usuários.</div>'}}renderUsers(){const e=this.container.querySelector("#users-list");if(this.users.length===0){e.innerHTML='<div class="empty">Nenhum usuário encontrado.</div>';return}e.innerHTML=this.users.map(t=>`
      <div class="user-item">
        <div class="user-info">
          <div class="user-name">${l(t.nome)}</div>
          <div class="user-details">
            <span class="user-points">${t.pontos} pontos</span>
            <span class="user-type ${t.tipo==="Administrador"?"admin":"user"}">
              ${t.tipo}
            </span>
          </div>
        </div>
        <div class="user-actions">
          <button 
            class="btn btn-sm btn-primary" 
            onclick="window.adminPanel.editUser('${t.id}', '${l(t.nome)}', '${l(t.senha)}', '${t.tipo}', ${t.pontos})"
          >
            ✏️ Editar
          </button>
          <button 
            class="btn btn-sm btn-danger" 
            data-delete-user="${t.id}"
            onclick="window.adminPanel.deleteUser('${t.id}', '${l(t.nome)}')"
          >
            🗑️ Excluir
          </button>
        </div>
      </div>
    `).join(""),window.adminPanel={editUser:(t,s,r,n,o)=>{this.showUserForm("edit",{id:t,nome:s,senha:r,tipo:n,pontos:o})},deleteUser:(t,s)=>this.handleDeleteUser(t,s)}}showSuccessMessage(e){const t=this.container.querySelector("#users-list"),s=document.createElement("div");s.className="success-message",s.textContent=e,t.prepend(s),setTimeout(()=>{s.remove()},3e3)}refresh(){this.loadUsers()}}class H{constructor(e){this.container=e,this.render(),this.setupEventListeners(),this.initializeComponents(),d.subscribe(this.handleStateChange.bind(this))}render(){this.container.innerHTML=`
      <div class="dashboard-container">
        <header class="dashboard-header">
          <div class="user-info">
            <h2>Bem-vindo, <span id="user-name"></span>!</h2>
            <div class="user-stats">
              <span class="points">Pontos: <span id="user-points"></span></span>
              <span class="type" id="user-type"></span>
            </div>
          </div>
          <button id="logout-button" class="btn btn-secondary">Sair</button>
        </header>

        <div id="admin-panel-container" class="admin-panel" style="display: none;"></div>

        <div class="dashboard-content">
          <div class="dashboard-grid">
            <section class="dashboard-section">
              <h3>📋 Tarefas Disponíveis</h3>
              <div id="tasks-container"></div>
            </section>

            <section class="dashboard-section">
              <h3>🎁 Loja de Prêmios</h3>
              <div id="rewards-container"></div>
            </section>

            <section class="dashboard-section">
              <h3>🏆 Ranking</h3>
              <div id="ranking-container"></div>
            </section>

            <section class="dashboard-section">
              <h3 id="history-title">📊 Histórico de Atividades</h3>
              <div id="history-container"></div>
            </section>
          </div>
        </div>
      </div>
    `}setupEventListeners(){this.container.querySelector("#logout-button").addEventListener("click",()=>{d.logout()})}initializeComponents(){const e=this.container.querySelector("#tasks-container"),t=this.container.querySelector("#rewards-container"),s=this.container.querySelector("#ranking-container"),r=this.container.querySelector("#history-container");this.tasksComponent=new A(e),this.rewardsComponent=new q(t),this.rankingComponent=new P(s),this.historyComponent=new D(r)}handleStateChange(e){if(!e.user)return;const t=this.container.querySelector("#user-name"),s=this.container.querySelector("#user-points"),r=this.container.querySelector("#user-type"),n=this.container.querySelector("#history-title"),o=this.container.querySelector("#admin-panel-container");t.textContent=e.user.nome,s.textContent=e.userPoints.toString(),r.textContent=e.userType||"",e.userType==="Administrador"?(o.style.display="block",n.textContent="📊 Histórico de Todos os Usuários",this.adminPanelComponent||(this.adminPanelComponent=new M(o))):(o.style.display="none",n.textContent="📊 Histórico de Atividades",this.adminPanelComponent=null),this.refreshComponents()}refreshComponents(){this.tasksComponent.refresh(),this.rewardsComponent.refresh(),this.rankingComponent.refresh(),this.historyComponent.refresh(),this.adminPanelComponent&&this.adminPanelComponent.refresh()}refresh(){this.refreshComponents()}}class N{constructor(e){this.container=e,this.init()}init(){d.subscribe(this.handleStateChange.bind(this)),this.handleStateChange(d.getState())}handleStateChange(e){e.user?this.showDashboard():this.showLogin()}showLogin(){this.container.innerHTML='<div id="login-container"></div>';const e=this.container.querySelector("#login-container");new I(e)}showDashboard(){this.container.innerHTML='<div id="dashboard-container"></div>';const e=this.container.querySelector("#dashboard-container");new H(e)}}document.addEventListener("DOMContentLoaded",()=>{const i=document.getElementById("app");if(!i)throw new Error("Container #app não encontrado no DOM");new N(i),console.log("🚀 Sistema de Gamificação de Tarefas inicializado!")});
//# sourceMappingURL=index-Dfl43K22.js.map
