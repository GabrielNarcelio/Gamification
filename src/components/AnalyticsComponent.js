import { Chart } from 'chart.js/auto';
import { stateManager } from '@/services/state.js';

export class AnalyticsComponent {
  constructor(container) {
    this.container = container;
    this.render();
    this.loadAnalytics();
    
    // ✅ Subscribe to state changes to auto-reload analytics
    this.unsubscribe = stateManager.subscribe(this.handleStateChange.bind(this));
  }

  // ✅ Handle state changes
  handleStateChange(newState) {
    if (newState.user && newState.lastUpdate && this.lastUpdate !== newState.lastUpdate) {
      // Only reload if there's a lastUpdate timestamp and it's different from our last one
      this.lastUpdate = newState.lastUpdate;
      this.loadAnalytics();
    }
  }

  // ✅ Cleanup method
  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  render() {
    this.container.innerHTML = `
      <div class="analytics-dashboard">
        <div class="stats-grid">
          <div class="stat-card">
            <h3>📊 Usuários Ativos</h3>
            <div class="stat-number" id="active-users">-</div>
            <div class="stat-subtitle">nos últimos 7 dias</div>
          </div>
          
          <div class="stat-card">
            <h3>✅ Tarefas Concluídas</h3>
            <div class="stat-number" id="completed-tasks">-</div>
            <div class="stat-subtitle">total</div>
          </div>
          
          <div class="stat-card">
            <h3>💎 Pontos Distribuídos</h3>
            <div class="stat-number" id="total-points">-</div>
            <div class="stat-subtitle">em pontos</div>
          </div>
          
          <div class="stat-card">
            <h3>🏆 Top Performer</h3>
            <div class="stat-number" id="top-user">-</div>
            <div class="stat-subtitle" id="top-points">- pontos</div>
          </div>
        </div>
        
        <div class="charts-grid">
          <div class="chart-card">
            <h3>📈 Atividade nos Últimos 30 Dias</h3>
            <canvas id="activity-chart"></canvas>
          </div>
          
          <div class="chart-card">
            <h3>🎯 Top 5 Usuários</h3>
            <canvas id="top-users-chart"></canvas>
          </div>
        </div>
      </div>
    `;
  }

  async loadAnalytics() {
    try {
      const response = await api.getAnalytics();
      if (response.success) {
        this.renderStats(response.data);
        this.renderCharts(response.data);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  }

  renderStats(data) {
    document.getElementById('active-users').textContent = data.userStats.active;
    document.getElementById('completed-tasks').textContent = data.taskStats.completed;
    document.getElementById('total-points').textContent = data.pointsDistribution.totalDistributed;
    
    if (data.topPerformers.length > 0) {
      document.getElementById('top-user').textContent = data.topPerformers[0].name;
      document.getElementById('top-points').textContent = `${data.topPerformers[0].points} pontos`;
    }
  }

  renderCharts(data) {
    // Gráfico de atividade
    const activityCtx = document.getElementById('activity-chart').getContext('2d');
    new Chart(activityCtx, {
      type: 'line',
      data: {
        labels: data.activityTimeline.map(d => new Date(d.date).toLocaleDateString('pt-BR')),
        datasets: [{
          label: 'Atividades',
          data: data.activityTimeline.map(d => d.count),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });

    // Gráfico de top usuários
    const topUsersCtx = document.getElementById('top-users-chart').getContext('2d');
    new Chart(topUsersCtx, {
      type: 'bar',
      data: {
        labels: data.topPerformers.map(u => u.name),
        datasets: [{
          label: 'Pontos',
          data: data.topPerformers.map(u => u.points),
          backgroundColor: [
            '#FF6384',
            '#36A2EB',
            '#FFCE56',
            '#4BC0C0',
            '#9966FF'
          ]
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }
}
