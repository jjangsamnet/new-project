class ProjectManager {
    constructor() {
        // 안전한 JSON 파싱
        try {
            this.projects = JSON.parse(localStorage.getItem('projects')) || [];
        } catch (error) {
            console.error('프로젝트 데이터 로드 실패:', error);
            this.projects = [];
            localStorage.removeItem('projects'); // 손상된 데이터 제거
        }
        this.currentEditingId = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.render();
        this.updateStats();
    }

    bindEvents() {
        const newProjectBtn = document.getElementById('new-project-btn');
        const modal = document.getElementById('project-modal');
        const closeBtn = modal?.querySelector('.close');
        const cancelBtn = document.getElementById('cancel-btn');
        const projectForm = document.getElementById('project-form');
        const statusFilter = document.getElementById('status-filter');
        const searchInput = document.getElementById('search-input');
        const progressSlider = document.getElementById('project-progress');
        const progressValue = document.getElementById('progress-value');
        const projectsGrid = document.getElementById('projects-grid');

        // DOM 요소 null 체크
        if (!newProjectBtn || !modal || !closeBtn || !cancelBtn || !projectForm ||
            !statusFilter || !searchInput || !progressSlider || !progressValue || !projectsGrid) {
            console.error('필수 DOM 요소를 찾을 수 없습니다.');
            return;
        }

        newProjectBtn.addEventListener('click', () => this.openModal());
        closeBtn.addEventListener('click', () => this.closeModal());
        cancelBtn.addEventListener('click', () => this.closeModal());
        projectForm.addEventListener('submit', (e) => this.handleSubmit(e));
        statusFilter.addEventListener('change', () => this.render());
        searchInput.addEventListener('input', () => this.render());
        progressSlider.addEventListener('input', (e) => {
            if (progressValue) {
                progressValue.textContent = e.target.value + '%';
            }
        });

        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });

        // 이벤트 위임: projects-grid에 한 번만 리스너 등록
        projectsGrid.addEventListener('click', (e) => {
            const button = e.target.closest('button[data-action]');
            if (!button) return;

            const action = button.dataset.action;
            const projectId = parseInt(button.dataset.projectId);

            if (action === 'edit') {
                const project = this.projects.find(p => p.id === projectId);
                if (project) this.openModal(project);
            } else if (action === 'delete') {
                this.deleteProject(projectId);
            }
        });
    }

    openModal(project = null) {
        const modal = document.getElementById('project-modal');
        const modalTitle = document.getElementById('modal-title');
        const form = document.getElementById('project-form');

        if (project) {
            modalTitle.textContent = '프로젝트 편집';
            this.populateForm(project);
            this.currentEditingId = project.id;
        } else {
            modalTitle.textContent = '새 프로젝트';
            form.reset();
            document.getElementById('progress-value').textContent = '0%';
            this.currentEditingId = null;
        }

        modal.style.display = 'block';
    }

    closeModal() {
        const modal = document.getElementById('project-modal');
        modal.style.display = 'none';
        this.currentEditingId = null;
    }

    populateForm(project) {
        document.getElementById('project-name').value = project.name;
        document.getElementById('project-description').value = project.description;
        document.getElementById('project-status').value = project.status;
        document.getElementById('project-priority').value = project.priority;
        document.getElementById('project-start-date').value = project.startDate;
        document.getElementById('project-end-date').value = project.endDate;
        document.getElementById('project-team').value = project.team.join(', ');
        document.getElementById('project-progress').value = project.progress;
        document.getElementById('progress-value').textContent = project.progress + '%';
    }

    handleSubmit(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const projectData = {
            id: this.currentEditingId || Date.now(),
            name: document.getElementById('project-name').value,
            description: document.getElementById('project-description').value,
            status: document.getElementById('project-status').value,
            priority: document.getElementById('project-priority').value,
            startDate: document.getElementById('project-start-date').value,
            endDate: document.getElementById('project-end-date').value,
            team: document.getElementById('project-team').value.split(',').map(t => t.trim()).filter(t => t),
            progress: parseInt(document.getElementById('project-progress').value),
            createdAt: this.currentEditingId ?
                this.projects.find(p => p.id === this.currentEditingId).createdAt :
                new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        if (this.currentEditingId) {
            const index = this.projects.findIndex(p => p.id === this.currentEditingId);
            this.projects[index] = projectData;
        } else {
            this.projects.push(projectData);
        }

        this.saveToStorage();
        this.render();
        this.updateStats();
        this.closeModal();
    }

    deleteProject(id) {
        if (confirm('이 프로젝트를 삭제하시겠습니까?')) {
            this.projects = this.projects.filter(p => p.id !== id);
            this.saveToStorage();
            this.render();
            this.updateStats();
        }
    }

    getFilteredProjects() {
        const statusFilter = document.getElementById('status-filter').value;
        const searchTerm = document.getElementById('search-input').value.toLowerCase();

        return this.projects.filter(project => {
            const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
            const matchesSearch = project.name.toLowerCase().includes(searchTerm) ||
                                project.description.toLowerCase().includes(searchTerm) ||
                                project.team.some(member => member.toLowerCase().includes(searchTerm));

            return matchesStatus && matchesSearch;
        });
    }

    render() {
        const projectsGrid = document.getElementById('projects-grid');

        if (!projectsGrid) {
            console.error('projects-grid 요소를 찾을 수 없습니다.');
            return;
        }

        const filteredProjects = this.getFilteredProjects();

        if (filteredProjects.length === 0) {
            projectsGrid.innerHTML = `
                <div class="empty-state">
                    <h3>프로젝트가 없습니다</h3>
                    <p>새 프로젝트를 추가해보세요!</p>
                </div>
            `;
            return;
        }

        projectsGrid.innerHTML = filteredProjects.map(project => this.createProjectCard(project)).join('');
    }

    createProjectCard(project) {
        const isOverdue = project.endDate && new Date(project.endDate) < new Date() && project.status !== 'completed';
        const formattedStartDate = project.startDate ? new Date(project.startDate).toLocaleDateString('ko-KR') : '';
        const formattedEndDate = project.endDate ? new Date(project.endDate).toLocaleDateString('ko-KR') : '';

        // XSS 방지: 사용자 입력 이스케이프
        const escapeHtml = (text) => {
            const map = {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'};
            return String(text || '').replace(/[&<>"']/g, (m) => map[m]);
        };

        const safeName = escapeHtml(project.name);
        const safeDescription = escapeHtml(project.description);
        const safeTeam = project.team.map(member => escapeHtml(member));

        return `
            <div class="project-card ${isOverdue ? 'overdue' : ''}">
                <div class="priority-indicator priority-${project.priority}"></div>
                <div class="project-header">
                    <div>
                        <h3 class="project-title">${safeName}</h3>
                        <span class="project-status status-${project.status}">${this.getStatusText(project.status)}</span>
                    </div>
                </div>
                <p class="project-description">${safeDescription}</p>
                <div class="project-meta">
                    <span>시작: ${formattedStartDate || '미정'}</span>
                    <span>마감: ${formattedEndDate || '미정'}</span>
                </div>
                <div class="project-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${project.progress}%"></div>
                    </div>
                    <small>${project.progress}% 완료</small>
                </div>
                <div class="project-team">
                    <strong>팀원:</strong> ${safeTeam.length > 0 ? safeTeam.join(', ') : '미지정'}
                </div>
                <div class="project-actions">
                    <button class="btn btn-secondary btn-small" data-action="edit" data-project-id="${project.id}">
                        편집
                    </button>
                    <button class="btn btn-danger btn-small" data-action="delete" data-project-id="${project.id}">
                        삭제
                    </button>
                </div>
            </div>
        `;
    }

    getStatusText(status) {
        const statusMap = {
            'planning': '기획',
            'in-progress': '진행중',
            'completed': '완료',
            'on-hold': '보류'
        };
        return statusMap[status] || status;
    }

    updateStats() {
        const totalProjects = this.projects.length;
        const activeProjects = this.projects.filter(p => p.status === 'in-progress').length;
        const completedProjects = this.projects.filter(p => p.status === 'completed').length;
        const overdueProjects = this.projects.filter(p =>
            p.endDate &&
            new Date(p.endDate) < new Date() &&
            p.status !== 'completed'
        ).length;

        document.getElementById('total-projects').textContent = totalProjects;
        document.getElementById('active-projects').textContent = activeProjects;
        document.getElementById('completed-projects').textContent = completedProjects;
        document.getElementById('overdue-projects').textContent = overdueProjects;
    }

    saveToStorage() {
        localStorage.setItem('projects', JSON.stringify(this.projects));
    }

    exportData() {
        const dataStr = JSON.stringify(this.projects, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

        const exportFileDefaultName = `projects_${new Date().toISOString().split('T')[0]}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }

    importData(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importedProjects = JSON.parse(e.target.result);
                    if (confirm('기존 데이터를 덮어쓰시겠습니까?')) {
                        this.projects = importedProjects;
                        this.saveToStorage();
                        this.render();
                        this.updateStats();
                        alert('데이터를 성공적으로 가져왔습니다.');
                    }
                } catch (error) {
                    alert('잘못된 파일 형식입니다.');
                }
            };
            reader.readAsText(file);
        }
    }
}

const projectManager = new ProjectManager();

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        projectManager.closeModal();
    }
});

window.exportProjects = () => projectManager.exportData();
window.importProjects = (event) => projectManager.importData(event);