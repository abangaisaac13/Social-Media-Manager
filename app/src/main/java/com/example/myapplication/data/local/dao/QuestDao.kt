package com.example.myapplication.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.example.myapplication.data.local.entity.QuestPackageEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface QuestDao {
    @Query("SELECT * FROM quest_packages")
    fun getAllQuests(): Flow<List<QuestPackageEntity>>

    @Query("SELECT * FROM quest_packages WHERE questId = :questId")
    fun getQuestById(questId: String): Flow<QuestPackageEntity?>

    @Query("SELECT * FROM quest_packages WHERE indicatorCode = :indicatorCode")
    fun getQuestsByIndicator(indicatorCode: String): Flow<List<QuestPackageEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertQuest(quest: QuestPackageEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertQuests(quests: List<QuestPackageEntity>)

    @Query("UPDATE quest_packages SET isCompleted = :isCompleted, score = :score, stars = :stars, attemptsCount = attemptsCount + 1, lastPlayedTimestamp = :timestamp, synced = :synced WHERE questId = :questId")
    suspend fun updateQuestProgress(
        questId: String,
        isCompleted: Boolean,
        score: Int,
        stars: Int,
        timestamp: Long,
        synced: Boolean
    )

    @Query("SELECT * FROM quest_packages WHERE synced = 0")
    suspend fun getUnsyncedQuests(): List<QuestPackageEntity>

    @Query("UPDATE quest_packages SET synced = 1 WHERE questId IN (:questIds)")
    suspend fun markQuestsAsSynced(questIds: List<String>)
}
