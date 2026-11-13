package com.example.myapplication.ui.quest

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.myapplication.domain.model.ItemBank

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun QuestChallengeScreen(
    quest: ItemBank,
    currentIndex: Int,
    selectedOptionIndex: Int?,
    feedbackMessage: String?,
    hintLevel: Int,
    lives: Int,
    bossHealth: Int,
    comboStreak: Int,
    disabledOptions: Set<Int>,
    isGameOver: Boolean,
    isCompleted: Boolean,
    score: Int,
    onOptionSelected: (Int) -> Unit,
    onUse5050: () -> Unit,
    onNextClicked: () -> Unit,
    onHintRequested: () -> Unit,
    onBack: () -> Unit
) {
    val question = quest.questions.getOrNull(currentIndex)

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Quest: ${quest.indicator_code}", color = Color.White) },
                navigationIcon = {
                    TextButton(onClick = onBack) { Text("Back", color = Color(0xFF38BDF8)) }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color(0xFF1E293B)
                )
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .background(Color(0xFF0F172A))
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // HUD: Hearts, Combo Streak, Score
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Hearts
                Row {
                    repeat(3) { i ->
                        Text(if (i < lives) "❤️" else "🖤", fontSize = 20.sp)
                    }
                }

                if (comboStreak > 1) {
                    Surface(color = Color(0xFFEA580C), shape = RoundedCornerShape(12.dp)) {
                        Text("🔥 ${comboStreak}x Multiplier", color = Color.White, modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp), fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    }
                }

                Text("🪙 $score PTS", color = Color(0xFFFACC15), fontWeight = FontWeight.Bold, fontSize = 16.sp)
            }

            // Boss Challenge Health Bar
            Card(
                colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B))
            ) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("👾 Challenge Boss Health", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                        Text("$bossHealth%", color = Color(0xFFEF4444), fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                    LinearProgressIndicator(
                        progress = { bossHealth / 100f },
                        modifier = Modifier.fillMaxWidth().height(8.dp).clip(RoundedCornerShape(4.dp)),
                        color = Color(0xFFEF4444),
                        trackColor = Color(0xFF334155)
                    )
                }
            }

            if (isGameOver) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF7F1D1D))
                ) {
                    Column(
                        modifier = Modifier.fillMaxWidth().padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text("💔 GAME OVER", style = MaterialTheme.typography.headlineSmall, color = Color.White, fontWeight = FontWeight.Bold)
                        Spacer(modifier = Modifier.height(8.dp))
                        Text("You ran out of hearts! Review the curriculum hints and try again.", color = Color.LightGray)
                        Spacer(modifier = Modifier.height(16.dp))
                        Button(onClick = onBack, colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFEF4444))) {
                            Text("Retry Stage")
                        }
                    }
                }
            } else if (isCompleted) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF065F46))
                ) {
                    Column(
                        modifier = Modifier.fillMaxWidth().padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text("🎁 VICTORY LOOT CHEST! 🎉", style = MaterialTheme.typography.headlineSmall, color = Color.White, fontWeight = FontWeight.Bold)
                        Spacer(modifier = Modifier.height(8.dp))
                        Text("⭐ Star Rating: 3 Stars!", color = Color(0xFFFACC15), fontWeight = FontWeight.Bold)
                        Text("🪙 Total Gold Won: +$score PTS", color = Color.White)
                        Text("🌟 XP Gained: +150 XP", color = Color(0xFF38BDF8))
                        Spacer(modifier = Modifier.height(16.dp))
                        Button(onClick = onBack, colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981))) {
                            Text("Claim Reward & Return to Overworld")
                        }
                    }
                }
            } else if (question != null) {
                // Narrative & Power-Up Bar
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Question ${currentIndex + 1} of ${quest.questions.size}", color = Color.LightGray, fontSize = 12.sp)
                    Button(
                        onClick = onUse5050,
                        enabled = disabledOptions.isEmpty(),
                        contentPadding = PaddingValues(horizontal = 8.dp, vertical = 2.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF6366F1))
                    ) {
                        Text("🛡️ 50/50 Shield", fontSize = 11.sp)
                    }
                }

                // Prompt Card
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B))
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(question.prompt, color = Color.White, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    }
                }

                // Options
                question.options.forEachIndexed { index, option ->
                    val isDisabled = disabledOptions.contains(index)
                    val isSelected = selectedOptionIndex == index
                    val containerColor = when {
                        isDisabled -> Color(0xFF334155)
                        isSelected && index == question.correct_index -> Color(0xFF059669)
                        isSelected -> Color(0xFFDC2626)
                        else -> Color(0xFF1E293B)
                    }

                    Button(
                        onClick = { if (!isDisabled) onOptionSelected(index) },
                        enabled = !isDisabled,
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(containerColor = containerColor),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text(
                            text = "${('A' + index)}. $option",
                            color = if (isDisabled) Color.Gray else Color.White,
                            modifier = Modifier.padding(8.dp)
                        )
                    }
                }

                // Diagnostic Misconception Feedback
                feedbackMessage?.let { msg ->
                    Card(
                        colors = CardDefaults.cardColors(
                            containerColor = if (selectedOptionIndex == question.correct_index) Color(0xFF065F46) else Color(0xFF991B1B)
                        )
                    ) {
                        Text(msg, modifier = Modifier.padding(12.dp), color = Color.White, fontSize = 13.sp)
                    }
                }

                // Hints & Next Button
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Button(onClick = onHintRequested, enabled = hintLevel < 3) {
                        Text(when (hintLevel) {
                            0 -> "💡 Request Hint"
                            1 -> "📐 Rule / Formula"
                            2 -> "📝 Worked Step"
                            else -> "Max Hints Used"
                        }, fontSize = 12.sp)
                    }

                    if (selectedOptionIndex != null) {
                        Button(
                            onClick = onNextClicked,
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF38BDF8))
                        ) {
                            Text(if (currentIndex < quest.questions.size - 1) "Next Question" else "Victory!", color = Color.Black, fontWeight = FontWeight.Bold)
                        }
                    }
                }

                if (hintLevel > 0) {
                    Card(colors = CardDefaults.cardColors(containerColor = Color(0xFF854D0E))) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Text("💡 Hint Tier $hintLevel:", fontWeight = FontWeight.Bold, color = Color.White)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(question.hints.getOrNull(hintLevel - 1) ?: "No further hints.", color = Color.White)
                        }
                    }
                }
            }
        }
    }
}
