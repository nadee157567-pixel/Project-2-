import 'package:flutter/material.dart';

class AdoptionStatusScreen extends StatelessWidget {
  final Map<String, dynamic> evaluationResult;
  final String catImageUrl;

  const AdoptionStatusScreen({
    super.key,
    required this.evaluationResult,
    required this.catImageUrl,
  });

  Widget _buildStep(String title, bool isCompleted, bool isActive, bool isLast) {
    return Expanded(
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: Container(
                  height: 3,
                  color: isCompleted ? Colors.green : Colors.transparent,
                ),
              ),
              Container(
                width: 24,
                height: 24,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: isCompleted
                      ? Colors.green
                      : isActive
                          ? Colors.yellow[700]
                          : Colors.grey[300],
                  boxShadow: isActive
                      ? [
                          BoxShadow(
                            color: Colors.yellow.withOpacity(0.5),
                            blurRadius: 8,
                            spreadRadius: 2,
                          )
                        ]
                      : null,
                ),
                child: isCompleted
                    ? const Icon(Icons.check, size: 16, color: Colors.white)
                    : null,
              ),
              Expanded(
                child: Container(
                  height: 3,
                  color: isCompleted && !isActive ? Colors.green : Colors.grey[300],
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            title,
            style: TextStyle(
              fontSize: 10,
              fontWeight: isActive || isCompleted ? FontWeight.bold : FontWeight.normal,
              color: isActive ? Colors.orange[800] : (isCompleted ? Colors.green : Colors.grey),
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildStarRow(String title, int score) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            mainAxisSize: MainAxisSize.min,
            children: List.generate(5, (index) {
              return Icon(
                index < score ? Icons.star : Icons.star_border,
                color: Colors.amber,
                size: 16,
              );
            }),
          ),
          const SizedBox(width: 16),
          SizedBox(
            width: 80,
            child: Text(title, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    int matchPercent = evaluationResult['matchPercent'] ?? 0;
    String statusText = "";
    Color statusColor = Colors.grey;

    if (matchPercent > 70) {
      statusText = "เหมาะสม";
      statusColor = Colors.green;
    } else if (matchPercent > 50) {
      statusText = "พอใช้";
      statusColor = Colors.yellow[700]!;
    } else {
      statusText = "ไม่เหมาะสม";
      statusColor = Colors.red;
    }

    return Scaffold(
      backgroundColor: const Color(0xFFFFF5F5), // Pale background
      appBar: AppBar(
        backgroundColor: const Color(0xFFFFAEAE), // Pink header
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.pets, color: Colors.white, size: 18),
            SizedBox(width: 4),
            Icon(Icons.pets, color: Colors.white, size: 24),
            SizedBox(width: 4),
            Icon(Icons.pets, color: Colors.white, size: 18),
          ],
        ),
        centerTitle: true,
      ),
      body: Stack(
        children: [
          SingleChildScrollView(
            child: Column(
              children: [
                Container(
                  width: double.infinity,
                  margin: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.05),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Column(
                    children: [
                      const SizedBox(height: 20),
                      const Text(
                        "สถานะคำขอเลี้ยง",
                        style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 24),
                      
                      // Stepper
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16.0),
                        child: Row(
                          children: [
                            _buildStep("ส่งคำขอสำเร็จ", true, false, false),
                            _buildStep("พูดคุย/สัมภาษณ์", false, true, false),
                            _buildStep("กำลังพิจารณา", false, false, false),
                            _buildStep("ทราบผล", false, false, true),
                          ],
                        ),
                      ),
                      
                      const SizedBox(height: 30),
                      
                      // Hero Image (Cat with clock)
                      Image.network(
                        'https://cdn-icons-png.flaticon.com/512/3209/3209971.png', // Placeholder cat with clock
                        height: 120,
                        errorBuilder: (context, error, stackTrace) => const Icon(Icons.pets, size: 80, color: Colors.orange),
                      ),
                      
                      const SizedBox(height: 20),
                      
                      const Text(
                        "ใบสมัครของคุณอยู่ระหว่างการพิจารณา",
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF1C3A5B)),
                      ),
                      
                      const Padding(
                        padding: EdgeInsets.symmetric(horizontal: 32.0, vertical: 8.0),
                        child: Text(
                          "ผู้โพสต์ได้รับข้อมูลการประเมินของคุณแล้ว\nกรุณารอการติดต่อกลับ หรือการอนุมัติเลี้ยงดู",
                          textAlign: TextAlign.center,
                          style: TextStyle(fontSize: 12, color: Colors.black54, height: 1.5),
                        ),
                      ),
                      
                      const SizedBox(height: 20),
                      
                      // Data Card
                      Container(
                        margin: const EdgeInsets.symmetric(horizontal: 24, vertical: 10),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.1),
                              blurRadius: 8,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Column(
                          children: [
                            // Cat image
                            ClipRRect(
                              borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                              child: catImageUrl.isNotEmpty
                                  ? Image.network(
                                      catImageUrl,
                                      height: 120,
                                      width: double.infinity,
                                      fit: BoxFit.cover,
                                      errorBuilder: (context, error, stackTrace) => Container(
                                        height: 120,
                                        width: double.infinity,
                                        color: Colors.grey[200],
                                        child: const Icon(Icons.pets, color: Colors.grey),
                                      ),
                                    )
                                  : Container(
                                      height: 120,
                                      width: double.infinity,
                                      color: Colors.grey[200],
                                      child: const Icon(Icons.pets, color: Colors.grey),
                                    ),
                            ),
                            
                            Padding(
                              padding: const EdgeInsets.all(16.0),
                              child: Column(
                                children: [
                                  // Badge 1
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: Colors.pink[50],
                                      borderRadius: BorderRadius.circular(20),
                                      border: Border.all(color: Colors.pink[100]!),
                                    ),
                                    child: const Text("ผลการประเมิน", style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                                  ),
                                  const SizedBox(height: 12),
                                  
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Container(
                                        width: 16,
                                        height: 16,
                                        decoration: BoxDecoration(
                                          shape: BoxShape.circle,
                                          color: statusColor,
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      Text(
                                        "$matchPercent%  $statusText",
                                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                                      ),
                                    ],
                                  ),
                                  
                                  const SizedBox(height: 16),
                                  
                                  // Badge 2
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: Colors.pink[50],
                                      borderRadius: BorderRadius.circular(20),
                                      border: Border.all(color: Colors.pink[100]!),
                                    ),
                                    child: const Text("คะแนนความเหมาะสม", style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                                  ),
                                  const SizedBox(height: 12),
                                  
                                  // Scores
                                  if (evaluationResult['scores'] != null) ...[
                                    _buildStarRow("ที่พักอาศัย", evaluationResult['scores']['space'] ?? 0),
                                    _buildStarRow("เวลาว่าง", evaluationResult['scores']['time'] ?? 0),
                                    _buildStarRow("ค่าใช้จ่าย", evaluationResult['scores']['budget'] ?? 0),
                                    _buildStarRow("ประสบการณ์", evaluationResult['scores']['experience'] ?? 0),
                                  ],
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 100), // Space for bottom button
                    ],
                  ),
                ),
              ],
            ),
          ),
          
          // Fixed Bottom Button
          Positioned(
            bottom: 30,
            left: 20,
            right: 20,
            child: Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () {
                      // กลับไปหน้าแรกสุด (หน้าค้นหาแมว)
                      Navigator.popUntil(context, (route) => route.isFirst);
                    },
                    style: OutlinedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: Colors.black87,
                      side: const BorderSide(color: Colors.pinkAccent, width: 1.5),
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
                    ),
                    child: const Text("ย้อนกลับ", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('กำลังติดต่อไปยังผู้โพสต์...')),
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.pink[400],
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
                    ),
                    child: const Text("ติดต่อผู้โพสต์", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
