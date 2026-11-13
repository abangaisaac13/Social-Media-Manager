package com.example.myapplication.ui.tabs

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import com.example.myapplication.ui.overworld.OverworldMapScreen
import com.example.myapplication.ui.quest.QuestChallengeScreen
import com.example.myapplication.ui.quest.QuestViewModel

sealed class Screen(val route: String, val title: String, val icon: String) {
    object Quests : Screen("quests", "Quests", "🗺️")
    object Duels : Screen("duels", "P2P Duels", "⚔️")
    object Tlm : Screen("tlm", "TLM & Curriculum", "📚")
    object Profile : Screen("profile", "Profile & SBA", "👤")
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen(viewModel: QuestViewModel) {
    var selectedTab by remember { mutableStateOf<Screen>(Screen.Quests) }
    val quests by viewModel.quests.collectAsState()
    val currentQuest by viewModel.currentQuest.collectAsState()
    val currentIndex by viewModel.currentQuestionIndex.collectAsState()
    val selectedOptionIndex by viewModel.selectedOptionIndex.collectAsState()
    val feedbackMessage by viewModel.feedbackMessage.collectAsState()
    val hintLevel by viewModel.currentHintLevel.collectAsState()
    val isCompleted by viewModel.questCompleted.collectAsState()
    val score by viewModel.earnedScore.collectAsState()

    val lives by viewModel.lives.collectAsState()
    val bossHealth by viewModel.bossHealth.collectAsState()
    val comboStreak by viewModel.comboStreak.collectAsState()
    val disabledOptions by viewModel.disabledOptions.collectAsState()
    val isGameOver by viewModel.isGameOver.collectAsState()

    if (currentQuest != null) {
        QuestChallengeScreen(
            quest = currentQuest!!,
            currentIndex = currentIndex,
            selectedOptionIndex = selectedOptionIndex,
            feedbackMessage = feedbackMessage,
            hintLevel = hintLevel,
            lives = lives,
            bossHealth = bossHealth,
            comboStreak = comboStreak,
            disabledOptions = disabledOptions,
            isGameOver = isGameOver,
            isCompleted = isCompleted,
            score = score,
            onOptionSelected = { index -> viewModel.selectOption(index) },
            onUse5050 = { viewModel.use5050PowerUp() },
            onNextClicked = { viewModel.nextQuestion() },
            onHintRequested = { viewModel.requestHint() },
            onBack = { viewModel.clearCurrentQuest() }
        )
    } else {
        Scaffold(
            bottomBar = {
                NavigationBar {
                    val screens = listOf(Screen.Quests, Screen.Duels, Screen.Tlm, Screen.Profile)
                    screens.forEach { screen ->
                        NavigationBarItem(
                            icon = { Text(screen.icon, style = MaterialTheme.typography.titleMedium) },
                            label = { Text(screen.title) },
                            selected = selectedTab == screen,
                            onClick = { selectedTab = screen }
                        )
                    }
                }
            }
        ) { padding ->
            Box(modifier = Modifier.fillMaxSize().padding(padding)) {
                when (selectedTab) {
                    Screen.Quests -> OverworldMapScreen(
                        quests = quests,
                        onQuestClick = { quest -> viewModel.selectQuest(quest) }
                    )
                    Screen.Duels -> DuelArenaScreen()
                    Screen.Tlm -> TlmCurriculumScreen()
                    Screen.Profile -> ProfileMetricsScreen()
                }
            }
        }
    }
}
