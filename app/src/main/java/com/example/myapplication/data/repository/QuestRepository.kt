package com.example.myapplication.data.repository

import com.example.myapplication.data.local.dao.QuestDao
import com.example.myapplication.data.local.entity.QuestPackageEntity
import com.example.myapplication.domain.model.ItemBank
import com.example.myapplication.domain.model.Question
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

class QuestRepository(private val questDao: QuestDao) {

    private val json = Json { ignoreUnknownKeys = true }

    val allQuests: Flow<List<ItemBank>> = questDao.getAllQuests().map { entities ->
        entities.map { entity -> mapEntityToDomain(entity) }
    }

    fun getQuest(questId: String): Flow<ItemBank?> {
        return questDao.getQuestById(questId).map { entity ->
            entity?.let { mapEntityToDomain(it) }
        }
    }

    suspend fun saveQuest(itemBank: ItemBank) {
        val questionsJsonString = json.encodeToString(itemBank.questions)
        val entity = QuestPackageEntity(
            questId = itemBank.quest_id,
            subjectId = itemBank.subject_id,
            gradeLevel = itemBank.grade_level,
            strand = itemBank.strand,
            subStrand = itemBank.sub_strand,
            indicatorCode = itemBank.indicator_code,
            mechanicType = itemBank.mechanic_type,
            narrativeHook = itemBank.narrative_hook,
            questionsJson = questionsJsonString,
            isCompleted = false,
            score = 0,
            stars = 0,
            synced = false
        )
        questDao.insertQuest(entity)
    }

    suspend fun updateProgress(questId: String, isCompleted: Boolean, score: Int, stars: Int) {
        questDao.updateQuestProgress(
            questId = questId,
            isCompleted = isCompleted,
            score = score,
            stars = stars,
            timestamp = System.currentTimeMillis(),
            synced = false
        )
    }

    suspend fun seedInitialCurriculum() {
        // Seed default GES NaCCA JHS Computing sample quest (B7.1.1.1)
        val sampleBank = ItemBank(
            subject_id = "JHS_COMPUTING",
            grade_level = "JHS_1",
            strand = "Introduction to Computing",
            sub_strand = "Components of Computers",
            indicator_code = "B7.1.1.1",
            quest_id = "quest_b7_1_1_1",
            mechanic_type = "MULTIPLE_CHOICE",
            narrative_hook = "Kofi wants to set up a solar-powered computer workstation in Sunyani for agricultural data collection. He needs to identify the core hardware components correctly.",
            questions = listOf(
                Question(
                    id = "q1",
                    prompt = "Which of the following devices is classified primarily as an input device in a computer system?",
                    options = arrayOf("Monitor", "Keyboard", "Speaker", "Printer").toList(),
                    correct_index = 1,
                    misconception_map = mapOf(
                        "0" to "A Monitor is an output device that displays visual information, not an input device.",
                        "2" to "A Speaker outputs sound waves, making it an output device.",
                        "3" to "A Printer produces physical hard copies on paper, acting as an output device."
                    ),
                    hints = listOf(
                        "Think about devices used to type data or give commands into the computer.",
                        "Input devices send data to the computer, while output devices display or print data from it.",
                        "The Keyboard allows users to enter text and numerical commands into the system."
                    )
                )
            )
        )
        saveQuest(sampleBank)
    }

    private fun mapEntityToDomain(entity: QuestPackageEntity): ItemBank {
        val questionsList: List<Question> = try {
            json.decodeFromString(entity.questionsJson)
        } catch (e: Exception) {
            emptyList()
        }

        return ItemBank(
            subject_id = entity.subjectId,
            grade_level = entity.gradeLevel,
            strand = entity.strand,
            sub_strand = entity.subStrand,
            indicator_code = entity.indicatorCode,
            quest_id = entity.questId,
            mechanic_type = entity.mechanicType,
            narrative_hook = entity.narrativeHook,
            questions = questionsList
        )
    }
}
