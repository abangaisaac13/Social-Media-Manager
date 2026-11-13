package com.example.myapplication.domain.duel

import kotlin.math.pow

object EloRatingEngine {
    private const val K_FACTOR = 32.0

    data class DuelResult(
        val playerNewRating: Int,
        val opponentNewRating: Int,
        val ratingChange: Int
    )

    fun calculateNewRatings(
        playerRating: Int,
        opponentRating: Int,
        playerWon: Boolean
    ): DuelResult {
        val expectedScorePlayer = 1.0 / (1.0 + 10.0.pow((opponentRating - playerRating) / 400.0))
        val actualScorePlayer = if (playerWon) 1.0 else 0.0

        val ratingDelta = (K_FACTOR * (actualScorePlayer - expectedScorePlayer)).toInt()

        val playerNew = (playerRating + ratingDelta).coerceAtLeast(100)
        val opponentNew = (opponentRating - ratingDelta).coerceAtLeast(100)

        return DuelResult(
            playerNewRating = playerNew,
            opponentNewRating = opponentNew,
            ratingChange = kotlin.math.abs(ratingDelta)
        )
    }
}
