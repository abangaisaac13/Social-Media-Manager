package com.example.myapplication.domain.model

import kotlinx.serialization.Serializable

@Serializable
data class ItemBank(
    val subject_id: String,
    val grade_level: String,
    val strand: String,
    val sub_strand: String,
    val indicator_code: String,
    val quest_id: String,
    val mechanic_type: String, // MULTIPLE_CHOICE, PUZZLE, SIMULATION, SPEED_DUEL
    val narrative_hook: String,
    val questions: List<Question>
)

@Serializable
data class Question(
    val id: String,
    val prompt: String,
    val options: List<String>,
    val correct_index: Int,
    val misconception_map: Map<String, String>, // key: option index as string, value: explanation
    val hints: List<String> // Step 1, Step 2, Step 3
)
