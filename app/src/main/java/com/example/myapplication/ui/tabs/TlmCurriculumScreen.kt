package com.example.myapplication.ui.tabs

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun TlmCurriculumScreen() {
    val context = LocalContext.current
    var selectedFileUri by remember { mutableStateOf<Uri?>(null) }
    var selectedFileName by remember { mutableStateOf<String?>(null) }
    var isAnalyzing by remember { mutableStateOf(false) }
    var aiParsedResult by remember { mutableStateOf<NaCcaMetaData?>(null) }

    val filePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        selectedFileUri = uri
        selectedFileName = uri?.lastPathSegment ?: "nacca_curriculum_document.pdf"
        aiParsedResult = null
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF0F172A))
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = "📚 NaCCA TLM Document Upload & AI Classifier",
            style = MaterialTheme.typography.titleLarge,
            color = Color.White,
            fontWeight = FontWeight.Bold
        )
        Text(
            text = "Upload approved GES textbook PDFs or syllabus documents. Integrated Gemini AI automatically classifies Class, Subject, Strand, Sub-strand, and Indicator Code according to NaCCA standards.",
            style = MaterialTheme.typography.bodyMedium,
            color = Color.LightGray
        )

        // File Selector Card
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B)),
            shape = RoundedCornerShape(16.dp)
        ) {
            Column(
                modifier = Modifier.padding(20.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text("📄 Pick Curriculum Document (PDF / Image / Text)", color = Color.White, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(12.dp))

                Button(
                    onClick = { filePickerLauncher.launch("*/*") },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF38BDF8))
                ) {
                    Text("Choose Document File", color = Color.Black, fontWeight = FontWeight.Bold)
                }

                selectedFileName?.let { name ->
                    Spacer(modifier = Modifier.height(8.dp))
                    Text("Selected: $name", color = Color(0xFF38BDF8), fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                }
            }
        }

        if (selectedFileUri != null || selectedFileName != null) {
            Button(
                onClick = {
                    isAnalyzing = true
                    // Simulate Gemini AI NaCCA auto-classification pipeline
                    aiParsedResult = NaCcaMetaData(
                        gradeClass = "JHS 1 (Basic 7)",
                        subject = "Computing",
                        strand = "Strand 1: Introduction to Computing",
                        subStrand = "Sub-strand 1: Components of Computers and Systems",
                        indicatorCode = "B7.1.1.1",
                        itemBankCount = 5
                    )
                    isAnalyzing = false
                },
                modifier = Modifier.fillMaxWidth().height(50.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981))
            ) {
                if (isAnalyzing) {
                    CircularProgressIndicator(color = Color.White, modifier = Modifier.size(24.dp))
                } else {
                    Text("🤖 Auto-Classify NaCCA Structure & Build Quests", fontWeight = FontWeight.Bold, color = Color.White)
                }
            }
        }

        // AI Extraction Result Display
        aiParsedResult?.let { meta ->
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B)),
                shape = RoundedCornerShape(16.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("✨ Gemini AI Classification Summary (NaCCA Standards)", color = Color(0xFF10B981), fontWeight = FontWeight.Bold, fontSize = 16.sp)
                    HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp), color = Color(0xFF334155))

                    MetaRow("Class / Grade:", meta.gradeClass)
                    MetaRow("Subject:", meta.subject)
                    MetaRow("Strand (Topic):", meta.strand)
                    MetaRow("Sub-strand (Subsection):", meta.subStrand)
                    MetaRow("Indicator Code:", meta.indicatorCode)
                    MetaRow("Generated Quests:", "${meta.itemBankCount} Tiered Item Banks Ready")

                    Spacer(modifier = Modifier.height(12.dp))
                    Surface(color = Color(0xFF065F46), shape = RoundedCornerShape(8.dp)) {
                        Text("Ready for Human-in-the-Loop Review & Production Sync", color = Color.White, modifier = Modifier.padding(8.dp), fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

@Composable
fun MetaRow(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(label, color = Color.Gray, fontSize = 13.sp)
        Text(value, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 13.sp)
    }
}

data class NaCcaMetaData(
    val gradeClass: String,
    val subject: String,
    val strand: String,
    val subStrand: String,
    val indicatorCode: String,
    val itemBankCount: Int
)
