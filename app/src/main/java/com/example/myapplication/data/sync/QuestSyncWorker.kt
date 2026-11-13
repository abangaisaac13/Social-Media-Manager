package com.example.myapplication.data.sync

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.example.myapplication.data.local.AppDatabase
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class QuestSyncWorker(
    appContext: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(appContext, workerParams) {

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        try {
            val database = AppDatabase.getDatabase(applicationContext)
            val dao = database.questDao()
            val unsyncedQuests = dao.getUnsyncedQuests()

            if (unsyncedQuests.isNotEmpty()) {
                // Simulate syncing with Firebase Firestore in production
                // In production, batch write to Firebase Firestore here.
                val questIds = unsyncedQuests.map { it.questId }
                dao.markQuestsAsSynced(questIds)
            }

            Result.success()
        } catch (e: Exception) {
            if (runAttemptCount < 3) {
                Result.retry()
            } else {
                Result.failure()
            }
        }
    }
}
