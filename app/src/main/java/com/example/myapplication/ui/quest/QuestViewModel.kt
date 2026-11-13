package com.example.myapplication.ui.quest

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.myapplication.data.local.AppDatabase
import com.example.myapplication.data.repository.QuestRepository
import com.example.myapplication.data.sync.SyncManager
import com.example.myapplication.domain.model.ItemBank
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class QuestViewModel(application: Application) : AndroidViewModel(application) {
    private val database = AppDatabase.getDatabase(application)
    private val repository = QuestRepository(database.questDao())

    val quests: StateFlow<List<ItemBank>> = repository.allQuests
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    private val _currentQuest = MutableStateFlow<ItemBank?>(null)
    val currentQuest: StateFlow<ItemBank?> = _currentQuest.asStateFlow()

    private val _currentQuestionIndex = MutableStateFlow(0)
    val currentQuestionIndex: StateFlow<Int> = _currentQuestionIndex.asStateFlow()

    private val _selectedOptionIndex = MutableStateFlow<Int?>(null)
    val selectedOptionIndex: StateFlow<Int?> = _selectedOptionIndex.asStateFlow()

    private val _feedbackMessage = MutableStateFlow<String?>(null)
    val feedbackMessage: StateFlow<String?> = _feedbackMessage.asStateFlow()

    private val _currentHintLevel = MutableStateFlow(0)
    val currentHintLevel: StateFlow<Int> = _currentHintLevel.asStateFlow()

    private val _questCompleted = MutableStateFlow(false)
    val questCompleted: StateFlow<Boolean> = _questCompleted.asStateFlow()

    private val _earnedScore = MutableStateFlow(0)
    val earnedScore: StateFlow<Int> = _earnedScore.asStateFlow()

    // Game Mechanics State
    private val _lives = MutableStateFlow(3)
    val lives: StateFlow<Int> = _lives.asStateFlow()

    private val _bossHealth = MutableStateFlow(100)
    val bossHealth: StateFlow<Int> = _bossHealth.asStateFlow()

    private val _comboStreak = MutableStateFlow(0)
    val comboStreak: StateFlow<Int> = _comboStreak.asStateFlow()

    private val _disabledOptions = MutableStateFlow<Set<Int>>(emptySet())
    val disabledOptions: StateFlow<Set<Int>> = _disabledOptions.asStateFlow()

    private val _isGameOver = MutableStateFlow(false)
    val isGameOver: StateFlow<Boolean> = _isGameOver.asStateFlow()

    init {
        viewModelScope.launch {
            repository.seedInitialCurriculum()
            SyncManager.scheduleSync(application)
        }
    }

    fun selectQuest(quest: ItemBank) {
        _currentQuest.value = quest
        _currentQuestionIndex.value = 0
        _selectedOptionIndex.value = null
        _feedbackMessage.value = null
        _currentHintLevel.value = 0
        _questCompleted.value = false
        _earnedScore.value = 0
        _lives.value = 3
        _bossHealth.value = 100
        _comboStreak.value = 0
        _disabledOptions.value = emptySet()
        _isGameOver.value = false
    }

    fun clearCurrentQuest() {
        _currentQuest.value = null
    }

    fun selectOption(index: Int) {
        _selectedOptionIndex.value = index
        val quest = _currentQuest.value ?: return
        val qIndex = _currentQuestionIndex.value
        if (qIndex >= quest.questions.size) return
        val question = quest.questions[qIndex]

        if (index == question.correct_index) {
            _comboStreak.value += 1
            val points = 100 * _comboStreak.value
            _earnedScore.value += points
            _bossHealth.value = (_bossHealth.value - (100 / quest.questions.size)).coerceAtLeast(0)
            _feedbackMessage.value = "🎯 DIRECT HIT! Streak ${_comboStreak.value}x! (+$points PTS)"
        } else {
            _comboStreak.value = 0
            _lives.value -= 1
            if (_lives.value <= 0) {
                _isGameOver.value = true
            }
            val misconception = question.misconception_map[index.toString()]
                ?: "Incorrect choice. Review the underlying rule."
            _feedbackMessage.value = misconception
        }
    }

    fun use5050PowerUp() {
        val quest = _currentQuest.value ?: return
        val qIndex = _currentQuestionIndex.value
        if (qIndex >= quest.questions.size) return
        val question = quest.questions[qIndex]

        val wrongIndices = question.options.indices.filter { it != question.correct_index }.take(2)
        _disabledOptions.value = wrongIndices.toSet()
    }

    fun nextQuestion() {
        val quest = _currentQuest.value ?: return
        if (_currentQuestionIndex.value < quest.questions.size - 1) {
            _currentQuestionIndex.value += 1
            _selectedOptionIndex.value = null
            _feedbackMessage.value = null
            _currentHintLevel.value = 0
            _disabledOptions.value = emptySet()
        } else {
            _questCompleted.value = true
            viewModelScope.launch {
                repository.updateProgress(
                    questId = quest.quest_id,
                    isCompleted = true,
                    score = _earnedScore.value,
                    stars = if (_earnedScore.value >= 100) 3 else 1
                )
            }
        }
    }

    fun requestHint() {
        if (_currentHintLevel.value < 3) {
            _currentHintLevel.value += 1
        }
    }
}
