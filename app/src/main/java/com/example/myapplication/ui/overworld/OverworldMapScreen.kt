package com.example.myapplication.ui.overworld

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.myapplication.domain.model.ItemBank

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OverworldMapScreen(
    quests: List<ItemBank>,
    onQuestClick: (ItemBank) -> Unit
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Ghana NaCCA Realm", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            BadgeChip(icon = "⚡", text = "100")
                            BadgeChip(icon = "🪙", text = "450")
                            BadgeChip(icon = "💎", text = "25")
                            BadgeChip(icon = "🔥", text = "5")
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color(0xFF1E293B),
                    titleContentColor = Color.White
                )
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .background(Color(0xFF0F172A)) // Dark game world theme
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Level & XP Bar Header
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B)),
                shape = RoundedCornerShape(16.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("🌟 Level 7 Explorer (JHS 1)", color = Color.White, fontWeight = FontWeight.Bold)
                        Text("350 / 500 XP", color = Color(0xFF38BDF8), fontWeight = FontWeight.SemiBold)
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    LinearProgressIndicator(
                        progress = { 0.7f },
                        modifier = Modifier.fillMaxWidth().height(10.dp).clip(RoundedCornerShape(5.dp)),
                        color = Color(0xFF38BDF8),
                        trackColor = Color(0xFF334155)
                    )
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            Text(
                text = "🏰 GES NaCCA Learning Path",
                style = MaterialTheme.typography.titleMedium,
                color = Color(0xFFF1F5F9),
                fontWeight = FontWeight.Bold
            )

            Spacer(modifier = Modifier.height(16.dp))

            // 2D Winding Game Canvas Map
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(420.dp)
                    .background(Color(0xFF1E293B), shape = RoundedCornerShape(24.dp))
                    .padding(16.dp)
            ) {
                // Draw path line connecting nodes
                Canvas(modifier = Modifier.fillMaxSize()) {
                    val path = Path().apply {
                        moveTo(size.width * 0.2f, size.height * 0.15f)
                        cubicTo(
                            size.width * 0.8f, size.height * 0.35f,
                            size.width * 0.1f, size.height * 0.65f,
                            size.width * 0.8f, size.height * 0.85f
                        )
                    }
                    drawPath(
                        path = path,
                        color = Color(0xFF38BDF8),
                        style = Stroke(width = 12f, pathEffect = PathEffect.dashPathEffect(floatArrayOf(20f, 15f), 0f))
                    )
                }

                // Render Game Quest Nodes along the path
                Column(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.SpaceBetween
                ) {
                    quests.forEachIndexed { index, quest ->
                        val alignModifier = when (index % 3) {
                            0 -> Modifier.align(Alignment.Start)
                            1 -> Modifier.align(Alignment.CenterHorizontally)
                            else -> Modifier.align(Alignment.End)
                        }

                        GameNodeButton(
                            stageNumber = index + 1,
                            indicatorCode = quest.indicator_code,
                            subject = quest.subject_id,
                            isUnlocked = true,
                            stars = if (index == 0) 3 else 0,
                            modifier = alignModifier,
                            onClick = { onQuestClick(quest) }
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun BadgeChip(icon: String, text: String) {
    Surface(
        color = Color(0xFF334155),
        shape = RoundedCornerShape(12.dp)
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(icon, fontSize = 12.sp)
            Spacer(modifier = Modifier.width(2.dp))
            Text(text, color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
fun GameNodeButton(
    stageNumber: Int,
    indicatorCode: String,
    subject: String,
    isUnlocked: Boolean,
    stars: Int,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Column(
        modifier = modifier.clickable(enabled = isUnlocked, onClick = onClick),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Surface(
            modifier = Modifier.size(64.dp),
            shape = CircleShape,
            color = if (isUnlocked) Color(0xFF38BDF8) else Color(0xFF475569),
            tonalElevation = 8.dp,
            shadowElevation = 8.dp
        ) {
            Box(contentAlignment = Alignment.Center) {
                Text(
                    text = "🎯 $stageNumber",
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp
                )
            }
        }
        Spacer(modifier = Modifier.height(4.dp))
        Surface(
            color = Color(0xFF334155),
            shape = RoundedCornerShape(8.dp)
        ) {
            Column(
                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(indicatorCode, color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                if (stars > 0) {
                    Text("⭐".repeat(stars), fontSize = 10.sp)
                }
            }
        }
    }
}
