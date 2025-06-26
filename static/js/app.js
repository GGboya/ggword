// 全局变量
let words = [];
let currentPracticeWords = [];
let currentPracticeIndex = 0;
let practiceType = 'en-to-cn';

// DOM元素
const elements = {
    // 标签页
    tabBtns: document.querySelectorAll('.tab-btn'),
    tabContents: document.querySelectorAll('.tab-content'),
    
    // 单词列表
    wordsList: document.getElementById('words-list'),
    searchInput: document.getElementById('search-input'),
    difficultyFilter: document.getElementById('difficulty-filter'),
    sortBy: document.getElementById('sort-by'),
    
    // 添加单词表单
    addWordForm: document.getElementById('add-word-form'),
    
    // 编辑单词模态框
    editModal: document.getElementById('edit-modal'),
    editForm: document.getElementById('edit-word-form'),
    closeBtn: document.querySelector('.close-btn'),
    cancelBtn: document.querySelector('.cancel-btn'),
    
    // 练习模式
    startPractice: document.getElementById('start-practice'),
    practiceTypeSelect: document.getElementById('practice-type'),
    practiceCard: document.getElementById('practice-card'),
    practiceWord: document.getElementById('practice-word'),
    practicePronunciation: document.getElementById('practice-pronunciation'),
    practiceAnswer: document.querySelector('.practice-answer'),
    practiceTranslation: document.getElementById('practice-translation'),
    practiceExample: document.getElementById('practice-example'),
    showAnswerBtn: document.getElementById('show-answer'),
    knowItBtn: document.getElementById('know-it'),
    dontKnowBtn: document.getElementById('dont-know'),
    nextWordBtn: document.getElementById('next-word'),
    practiceCurrent: document.getElementById('practice-current'),
    practiceTotal: document.getElementById('practice-total'),
    
    // 统计信息
    totalWords: document.getElementById('total-words'),
    totalReviews: document.getElementById('total-reviews'),
    avgDifficulty: document.getElementById('avg-difficulty'),
    masteredWords: document.getElementById('mastered-words'),
    difficultyChart: document.getElementById('difficulty-chart'),
    
    // 通知
    notification: document.getElementById('notification'),
    notificationMessage: document.getElementById('notification-message')
};

// 初始化应用
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
});

// 初始化应用
function initializeApp() {
    loadWords();
    updateStats();
}

// 设置事件监听器
function setupEventListeners() {
    // 标签页切换
    elements.tabBtns.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    
    // 搜索和过滤
    elements.searchInput.addEventListener('input', filterWords);
    elements.difficultyFilter.addEventListener('change', filterWords);
    elements.sortBy.addEventListener('change', filterWords);
    
    // 添加单词表单
    elements.addWordForm.addEventListener('submit', handleAddWord);
    
    // 编辑单词模态框
    elements.closeBtn.addEventListener('click', closeEditModal);
    elements.cancelBtn.addEventListener('click', closeEditModal);
    elements.editForm.addEventListener('submit', handleEditWord);
    
    // 练习模式
    elements.startPractice.addEventListener('click', startPractice);
    elements.practiceTypeSelect.addEventListener('change', (e) => {
        practiceType = e.target.value;
    });
    elements.showAnswerBtn.addEventListener('click', showAnswer);
    elements.knowItBtn.addEventListener('click', () => reviewWord(true));
    elements.dontKnowBtn.addEventListener('click', () => reviewWord(false));
    elements.nextWordBtn.addEventListener('click', nextWord);
    
    // 点击模态框外部关闭
    elements.editModal.addEventListener('click', (e) => {
        if (e.target === elements.editModal) {
            closeEditModal();
        }
    });
}

// 切换标签页
function switchTab(tabName) {
    // 更新按钮状态
    elements.tabBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    // 更新内容显示
    elements.tabContents.forEach(content => {
        content.classList.toggle('active', content.id === `${tabName}-tab`);
    });
    
    // 如果切换到统计页面，更新统计数据
    if (tabName === 'stats') {
        updateStats();
    }
}

// 加载单词数据
async function loadWords() {
    try {
        const response = await fetch('/api/words');
        if (response.ok) {
            words = await response.json();
            displayWords(words);
        } else {
            showNotification('加载单词失败', 'error');
        }
    } catch (error) {
        console.error('Error loading words:', error);
        showNotification('加载单词失败', 'error');
    }
}

// 显示单词列表
function displayWords(wordsToShow) {
    if (wordsToShow.length === 0) {
        elements.wordsList.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                <i class="fas fa-book-open" style="font-size: 3rem; margin-bottom: 20px; opacity: 0.3;"></i>
                <p>还没有单词，快去添加一些单词吧！</p>
            </div>
        `;
        return;
    }
    
    elements.wordsList.innerHTML = wordsToShow.map(word => `
        <div class="word-card">
            <div class="word-header">
                <div class="word-english">${word.english}</div>
                <div class="word-difficulty">${getDifficultyStars(word.difficulty)}</div>
            </div>
            <div class="word-chinese">${word.chinese}</div>
            ${word.pronunciation ? `<div class="word-pronunciation">${word.pronunciation}</div>` : ''}
            ${word.example ? `<div class="word-example">${word.example}</div>` : ''}
            <div class="word-meta">
                <span>复习次数: ${word.review_count}</span>
                <span>${formatDate(word.created_at)}</span>
            </div>
            <div class="word-actions">
                <button class="btn-icon review" onclick="reviewWordById(${word.id})" title="复习">
                    <i class="fas fa-brain"></i>
                </button>
                <button class="btn-icon edit" onclick="editWord(${word.id})" title="编辑">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon delete" onclick="deleteWord(${word.id})" title="删除">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// 获取难度星级
function getDifficultyStars(difficulty) {
    return '⭐'.repeat(difficulty);
}

// 格式化日期
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN');
}

// 过滤单词
function filterWords() {
    const searchTerm = elements.searchInput.value.toLowerCase();
    const difficultyFilter = elements.difficultyFilter.value;
    const sortBy = elements.sortBy.value;
    
    let filteredWords = words.filter(word => {
        const matchesSearch = word.english.toLowerCase().includes(searchTerm) ||
                            word.chinese.toLowerCase().includes(searchTerm);
        const matchesDifficulty = !difficultyFilter || word.difficulty == difficultyFilter;
        
        return matchesSearch && matchesDifficulty;
    });
    
    // 排序
    filteredWords.sort((a, b) => {
        switch (sortBy) {
            case 'english':
                return a.english.localeCompare(b.english);
            case 'difficulty':
                return a.difficulty - b.difficulty;
            case 'review':
                return b.review_count - a.review_count;
            case 'created':
            default:
                return new Date(b.created_at) - new Date(a.created_at);
        }
    });
    
    displayWords(filteredWords);
}

// 添加单词
async function handleAddWord(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const wordData = {
        english: formData.get('english'),
        chinese: formData.get('chinese'),
        pronunciation: formData.get('pronunciation'),
        example: formData.get('example'),
        difficulty: parseInt(formData.get('difficulty'))
    };
    
    try {
        const response = await fetch('/api/words', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(wordData)
        });
        
        if (response.ok) {
            const newWord = await response.json();
            words.unshift(newWord);
            displayWords(words);
            e.target.reset();
            showNotification('单词添加成功！');
            switchTab('words');
        } else {
            showNotification('添加单词失败', 'error');
        }
    } catch (error) {
        console.error('Error adding word:', error);
        showNotification('添加单词失败', 'error');
    }
}

// 编辑单词
function editWord(id) {
    const word = words.find(w => w.id === id);
    if (!word) return;
    
    // 填充表单
    document.getElementById('edit-id').value = word.id;
    document.getElementById('edit-english').value = word.english;
    document.getElementById('edit-chinese').value = word.chinese;
    document.getElementById('edit-pronunciation').value = word.pronunciation || '';
    document.getElementById('edit-example').value = word.example || '';
    document.getElementById('edit-difficulty').value = word.difficulty;
    
    // 显示模态框
    elements.editModal.classList.remove('hidden');
}

// 处理编辑单词
async function handleEditWord(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const id = parseInt(formData.get('id') || document.getElementById('edit-id').value);
    const wordData = {
        english: formData.get('english'),
        chinese: formData.get('chinese'),
        pronunciation: formData.get('pronunciation'),
        example: formData.get('example'),
        difficulty: parseInt(formData.get('difficulty'))
    };
    
    try {
        const response = await fetch(`/api/words/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(wordData)
        });
        
        if (response.ok) {
            const updatedWord = await response.json();
            const index = words.findIndex(w => w.id === id);
            if (index !== -1) {
                words[index] = updatedWord;
                displayWords(words);
            }
            closeEditModal();
            showNotification('单词更新成功！');
        } else {
            showNotification('更新单词失败', 'error');
        }
    } catch (error) {
        console.error('Error updating word:', error);
        showNotification('更新单词失败', 'error');
    }
}

// 关闭编辑模态框
function closeEditModal() {
    elements.editModal.classList.add('hidden');
}

// 删除单词
async function deleteWord(id) {
    if (!confirm('确定要删除这个单词吗？')) return;
    
    try {
        const response = await fetch(`/api/words/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            words = words.filter(w => w.id !== id);
            displayWords(words);
            showNotification('单词删除成功！');
        } else {
            showNotification('删除单词失败', 'error');
        }
    } catch (error) {
        console.error('Error deleting word:', error);
        showNotification('删除单词失败', 'error');
    }
}

// 复习单词（通过ID）
async function reviewWordById(id) {
    try {
        const response = await fetch(`/api/words/${id}/review`, {
            method: 'POST'
        });
        
        if (response.ok) {
            const updatedWord = await response.json();
            const index = words.findIndex(w => w.id === id);
            if (index !== -1) {
                words[index] = updatedWord;
                displayWords(words);
            }
            showNotification('复习次数已更新！');
        } else {
            showNotification('复习更新失败', 'error');
        }
    } catch (error) {
        console.error('Error reviewing word:', error);
        showNotification('复习更新失败', 'error');
    }
}

// 开始练习
function startPractice() {
    if (words.length === 0) {
        showNotification('没有单词可以练习', 'warning');
        return;
    }
    
    currentPracticeWords = [...words].sort(() => Math.random() - 0.5);
    currentPracticeIndex = 0;
    
    elements.practiceCard.classList.remove('hidden');
    elements.startPractice.style.display = 'none';
    elements.practiceTotal.textContent = currentPracticeWords.length;
    
    showPracticeWord();
}

// 显示练习单词
function showPracticeWord() {
    if (currentPracticeIndex >= currentPracticeWords.length) {
        endPractice();
        return;
    }
    
    const word = currentPracticeWords[currentPracticeIndex];
    elements.practiceCurrent.textContent = currentPracticeIndex + 1;
    
    // 根据练习类型显示不同内容
    if (practiceType === 'en-to-cn') {
        elements.practiceWord.textContent = word.english;
        elements.practicePronunciation.textContent = word.pronunciation || '';
        elements.practiceTranslation.textContent = word.chinese;
    } else if (practiceType === 'cn-to-en') {
        elements.practiceWord.textContent = word.chinese;
        elements.practicePronunciation.textContent = '';
        elements.practiceTranslation.textContent = word.english;
    } else { // mixed
        const isEnToCn = Math.random() > 0.5;
        if (isEnToCn) {
            elements.practiceWord.textContent = word.english;
            elements.practicePronunciation.textContent = word.pronunciation || '';
            elements.practiceTranslation.textContent = word.chinese;
        } else {
            elements.practiceWord.textContent = word.chinese;
            elements.practicePronunciation.textContent = '';
            elements.practiceTranslation.textContent = word.english;
        }
    }
    
    elements.practiceExample.textContent = word.example || '';
    
    // 重置按钮状态
    elements.practiceAnswer.classList.add('hidden');
    elements.showAnswerBtn.classList.remove('hidden');
    elements.knowItBtn.classList.add('hidden');
    elements.dontKnowBtn.classList.add('hidden');
    elements.nextWordBtn.classList.add('hidden');
}

// 显示答案
function showAnswer() {
    elements.practiceAnswer.classList.remove('hidden');
    elements.showAnswerBtn.classList.add('hidden');
    elements.knowItBtn.classList.remove('hidden');
    elements.dontKnowBtn.classList.remove('hidden');
}

// 复习单词（练习模式中）
async function reviewWord(known) {
    const word = currentPracticeWords[currentPracticeIndex];
    
    // 更新复习次数
    await reviewWordById(word.id);
    
    elements.knowItBtn.classList.add('hidden');
    elements.dontKnowBtn.classList.add('hidden');
    elements.nextWordBtn.classList.remove('hidden');
}

// 下一个单词
function nextWord() {
    currentPracticeIndex++;
    showPracticeWord();
}

// 结束练习
function endPractice() {
    elements.practiceCard.classList.add('hidden');
    elements.startPractice.style.display = 'inline-flex';
    showNotification('练习完成！');
    updateStats();
}

// 更新统计信息
function updateStats() {
    if (words.length === 0) {
        elements.totalWords.textContent = '0';
        elements.totalReviews.textContent = '0';
        elements.avgDifficulty.textContent = '0';
        elements.masteredWords.textContent = '0';
        elements.difficultyChart.innerHTML = '<p style="text-align: center; color: #666;">暂无数据</p>';
        return;
    }
    
    const totalWords = words.length;
    const totalReviews = words.reduce((sum, word) => sum + word.review_count, 0);
    const avgDifficulty = (words.reduce((sum, word) => sum + word.difficulty, 0) / totalWords).toFixed(1);
    const masteredWords = words.filter(word => word.review_count >= 5).length;
    
    elements.totalWords.textContent = totalWords;
    elements.totalReviews.textContent = totalReviews;
    elements.avgDifficulty.textContent = avgDifficulty;
    elements.masteredWords.textContent = masteredWords;
    
    // 难度分布图表
    const difficultyCount = [0, 0, 0, 0, 0];
    words.forEach(word => {
        difficultyCount[word.difficulty - 1]++;
    });
    
    const maxCount = Math.max(...difficultyCount);
    elements.difficultyChart.innerHTML = difficultyCount.map((count, index) => {
        const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
        return `
            <div class="chart-bar" style="height: ${height}%;">
                ${count}
                <div class="chart-bar-label">${index + 1}⭐</div>
            </div>
        `;
    }).join('');
}

// 显示通知
function showNotification(message, type = 'success') {
    elements.notificationMessage.textContent = message;
    elements.notification.className = `notification ${type}`;
    elements.notification.classList.remove('hidden');
    
    setTimeout(() => {
        elements.notification.classList.add('hidden');
    }, 3000);
}

// 键盘快捷键
document.addEventListener('keydown', function(e) {
    // ESC 关闭模态框
    if (e.key === 'Escape' && !elements.editModal.classList.contains('hidden')) {
        closeEditModal();
    }
    
    // 练习模式快捷键
    if (!elements.practiceCard.classList.contains('hidden')) {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            if (!elements.showAnswerBtn.classList.contains('hidden')) {
                showAnswer();
            } else if (!elements.nextWordBtn.classList.contains('hidden')) {
                nextWord();
            }
        }
        if (e.key === '1' && !elements.knowItBtn.classList.contains('hidden')) {
            reviewWord(true);
        }
        if (e.key === '2' && !elements.dontKnowBtn.classList.contains('hidden')) {
            reviewWord(false);
        }
    }
});