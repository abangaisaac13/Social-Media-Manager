package com.example.myapplication.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "quest_packages")
data class QuestPackageEntity(
    @PrimaryKey
    val questId: String,
    val subjectId: String,
    val gradeLevel: String,
    val strand: String,
    val subStrand: String,
    val indicatorCode: String,
    val mechanicType: String,
    val narrativeHook: String,
    val questionsJson: String, // JSON representation of List<Question>
    
    // Local player progress & SBA metrics
    val isCompleted: Boolean = false,
    val score: Int = 0,
    val stars: Int = 0,
    val attemptsCount: Int = 0,
    val lastPlayedTimestamp: Long = 0L,
    val synced: Boolean = false
)
