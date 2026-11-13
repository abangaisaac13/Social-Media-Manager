package com.example.myapplication.ui.tabs

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.myapplication.domain.duel.EloRatingEngine

@Composable
fun DuelArenaScreen() {
    var playerRating by remember { mutableStateOf(1200) }
    var opponentRating by remember { mutableStateOf(1180) }
    var duelStatus by remember { mutableStateOf("Ready for P2P Speed Duel") }
    var lastDelta by remember { mutableStateOf(0) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFFF4F6F9))
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text("⚔️ P2P Speed Duel Arena", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(12.dp))
                Text("Your Elo Rating: $playerRating", style = MaterialTheme.typography.titleMedium)
                Text("Opponent Elo Rating: $opponentRating", style = MaterialTheme.typography.bodyMedium)
                Spacer(modifier = Modifier.height(16.dp))
                Text(duelStatus, style = MaterialTheme.typography.bodyLarge, color = MaterialTheme.colorScheme.primary)
                if (lastDelta != 0) {
                    Text("Rating Change: +$lastDelta pts", fontWeight = FontWeight.Bold, color = Color(0xFF2E7D32))
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        Button(
            onClick = {
                // Simulate duel win
                val result = EloRatingEngine.calculateNewRatings(playerRating, opponentRating, true)
                playerRating = result.playerNewRating
                opponentRating = result.opponentNewRating
                lastDelta = result.ratingChange
                duelStatus = "Victory! You answered faster and more accurately."
            },
            modifier = Modifier.fillMaxWidth().height(50.dp),
            shape = RoundedCornerShape(12.dp)
        ) {
            Text("Find Match & Compete", fontWeight = FontWeight.Bold)
        }
    }
}
