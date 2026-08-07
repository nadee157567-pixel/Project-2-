import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'adopter_profile_screen.dart'; 
import 'adoption_status_screen.dart';
import 'adoption_requests_screen.dart';

class EvaluationScreen extends StatefulWidget {
  final int userId;
  final int catId;
  final String catImageUrl;

  const EvaluationScreen({
    super.key,
    required this.userId,
    required this.catId,
    required this.catImageUrl,
  });

  @override
  State<EvaluationScreen> createState() => _EvaluationScreenState();
}

class _EvaluationScreenState extends State<EvaluationScreen> {
  static Set<int> requestedCats = {};
  Map<String, dynamic>? evaluationResult;
  bool isLoading = true; // Auto start loading
  bool isEvaluated = false;

  @override
  void initState() {
    super.initState();
    // Fetch immediately on load
    fetchEvaluationScore();
  }

  Future<void> fetchEvaluationScore() async {
    setState(() => isLoading = true);
    
    try {
      final url = Uri.parse('http://10.0.2.2:3000/api/evaluate/${widget.userId}/${widget.catId}');
      final response = await http.get(url);

      if (response.statusCode == 200) {
        final jsonResponse = json.decode(response.body);
        if (jsonResponse['success']) {
          setState(() {
            evaluationResult = jsonResponse['data'];
            isEvaluated = true;
          });
        }
      }
    } catch (e) {
      print("เกิดข้อผิดพลาดในการดึงข้อมูล: $e");
    } finally {
      if (mounted) setState(() => isLoading = false);
    }
  }

  void _navigateToEditProfile() async {
    // Navigate to AdopterProfileScreen with isEditing = true
    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => AdopterProfileScreen(
          userId: widget.userId,
          catId: widget.catId,
          isEditing: true, // we will add this property
        ),
      ),
    );

    // if returned true, re-evaluate
    if (result == true && mounted) {
      fetchEvaluationScore();
    }
  }

  Widget _buildStarRow(String title, int score) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: List.generate(5, (index) {
              return Icon(
                index < score ? Icons.star : Icons.star_border,
                color: Colors.amber,
                size: 20,
              );
            }),
          ),
          Text(title, style: const TextStyle(fontSize: 16)),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.pink[50],
      appBar: AppBar(
        title: const Text('ประเมินความเหมาะสม', style: TextStyle(color: Colors.black)),
        backgroundColor: Colors.pink[100],
        iconTheme: const IconThemeData(color: Colors.black),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit, color: Colors.black87),
            tooltip: 'แก้ไขข้อมูลโปรไฟล์',
            onPressed: _navigateToEditProfile,
          )
        ],
      ),
      body: isLoading 
        ? const Center(child: CircularProgressIndicator(color: Colors.pink))
        : Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            if (isEvaluated && evaluationResult != null) ...(() {
              int matchPercent = evaluationResult!['matchPercent'];
              String statusText;
              MaterialColor statusColor = Colors.grey;
              IconData statusIcon;
              bool canAdopt = true;
              List<String> reasons = [];

              if (matchPercent > 70) {
                statusText = '$matchPercent% เหมาะสม';
                statusColor = Colors.green;
                statusIcon = Icons.check_circle;
              } else if (matchPercent > 50) {
                statusText = '$matchPercent% พอใช้';
                statusColor = Colors.orange;
                statusIcon = Icons.info;
                
                if (evaluationResult!['scores']['space'] < 3) reasons.add("พื้นที่พักอาศัยอาจคับแคบไปสำหรับแมวตัวนี้");
                if (evaluationResult!['scores']['time'] < 3) reasons.add("เวลาที่คุณมีให้อาจยังไม่เพียงพอ");
                if (evaluationResult!['scores']['budget'] < 3) reasons.add("งบประมาณอาจค่อนข้างตึงตัว");
                if (evaluationResult!['scores']['experience'] < 3) reasons.add("อาจต้องศึกษาข้อมูลการเลี้ยงแมวเพิ่มเติม");
              } else {
                statusText = '$matchPercent% ไม่เหมาะสม';
                statusColor = Colors.red;
                statusIcon = Icons.cancel;
                canAdopt = false;

                if (evaluationResult!['scores']['space'] < 3) reasons.add("พื้นที่พักอาศัยไม่สอดคล้องกับความต้องการของแมว");
                if (evaluationResult!['scores']['time'] < 3) reasons.add("แมวตัวนี้ต้องการเวลาดูแลเอาใจใส่มากกว่านี้");
                if (evaluationResult!['scores']['budget'] < 3) reasons.add("ค่าใช้จ่ายรายเดือนของคุณยังไม่ครอบคลุมค่าดูแลแมวตัวนี้");
                if (evaluationResult!['scores']['experience'] < 3) reasons.add("แมวตัวนี้เหมาะกับผู้เลี้ยงที่มีประสบการณ์มากกว่า");
              }

              return [
                Card(
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  child: Padding(
                    padding: const EdgeInsets.all(20.0),
                    child: Column(
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(statusIcon, color: statusColor, size: 28),
                            const SizedBox(width: 8),
                            Text(
                              statusText,
                              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: statusColor),
                            ),
                          ],
                        ),
                        if (reasons.isNotEmpty) ...[
                          const SizedBox(height: 16),
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: statusColor.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  matchPercent > 50 ? "ข้อสังเกต:" : "สาเหตุที่ไม่เหมาะสม:",
                                  style: TextStyle(fontWeight: FontWeight.bold, color: statusColor[800]),
                                ),
                                const SizedBox(height: 8),
                                ...reasons.map((reason) => Padding(
                                  padding: const EdgeInsets.only(bottom: 4),
                                  child: Row(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text("• ", style: TextStyle(color: statusColor[800], fontWeight: FontWeight.bold)),
                                      Expanded(
                                        child: Text(reason, style: TextStyle(color: statusColor[800], fontSize: 13)),
                                      ),
                                    ],
                                  ),
                                )).toList(),
                              ],
                            ),
                          ),
                        ],
                        const Divider(height: 32, thickness: 1),
                        const Text('คะแนนความเหมาะสมรายด้าน', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                        const SizedBox(height: 16),
                        _buildStarRow('ที่พักอาศัย', evaluationResult!['scores']['space']),
                        _buildStarRow('เวลาว่าง', evaluationResult!['scores']['time']),
                        _buildStarRow('ค่าใช้จ่าย', evaluationResult!['scores']['budget']),
                        _buildStarRow('ประสบการณ์', evaluationResult!['scores']['experience']),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                if (canAdopt && !requestedCats.contains(widget.catId))
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.green[400],
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                      ),
                      onPressed: () async {
                        try {
                          final response = await http.post(
                            Uri.parse('http://10.0.2.2:3000/api/adoption/request'),
                            headers: {"Content-Type": "application/json"},
                            body: jsonEncode({
                              "catId": widget.catId,
                              "applicantId": widget.userId,
                              "matchscore": evaluationResult?['matchPercent'] ?? 0,
                              "uploadRemark": "ยื่นคำขอผ่านระบบจับคู่แมว"
                            }),
                          );

                          if (response.statusCode == 201) {
                            setState(() {
                              requestedCats.add(widget.catId);
                            });

                            if (!mounted) return;
                            showDialog(
                              context: context,
                              barrierDismissible: false,
                              builder: (context) => AlertDialog(
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                                title: const Row(
                                  children: [
                                    Icon(Icons.check_circle, color: Colors.green),
                                    SizedBox(width: 10),
                                    Text("ส่งคำขอสำเร็จ!", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                                  ],
                                ),
                                content: const Text("คำขอรับเลี้ยงของคุณได้ถูกส่งไปยังผู้โพสต์เรียบร้อยแล้ว"),
                                actions: [
                                  TextButton(
                                    onPressed: () {
                                      Navigator.pop(context); // ปิด Dialog
                                      Navigator.pop(context); // กลับไปหน้า Cat Detail หรือ Home
                                    },
                                    child: const Text("กลับหน้าหลัก", style: TextStyle(color: Colors.grey)),
                                  ),
                                  ElevatedButton(
                                    onPressed: () {
                                      Navigator.pop(context); // ปิด Dialog
                                      Navigator.push(
                                        context,
                                        MaterialPageRoute(
                                          builder: (context) => AdoptionStatusScreen(
                                            evaluationResult: evaluationResult!,
                                            catImageUrl: widget.catImageUrl,
                                          ),
                                        ),
                                      );
                                    },
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: Colors.pink[400],
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                                    ),
                                      child: const Text("เช็คสถานะคำขอ", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                                    ),
                                  ],
                                ),
                              );
                          } else {
                            if (!mounted) return;
                            final data = jsonDecode(response.body);
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text(data['message'] ?? 'เกิดข้อผิดพลาดในการส่งคำขอ')),
                            );
                          }
                        } catch (e) {
                          if (!mounted) return;
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้')),
                          );
                        }
                      },
                      child: const Text('ส่งคำขอรับเลี้ยง', style: TextStyle(fontSize: 18, color: Colors.white, fontWeight: FontWeight.bold)),
                    ),
                  )
                else if (canAdopt && requestedCats.contains(widget.catId))
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.grey[400],
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                      ),
                      onPressed: null, // Disabled
                      child: const Text('ส่งคำขอรับเลี้ยงแล้ว', style: TextStyle(fontSize: 16, color: Colors.white, fontWeight: FontWeight.bold)),
                    ),
                  )
                else
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.grey[400],
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                      ),
                      onPressed: null, // Disabled
                      child: const Text('ไม่สามารถส่งคำขอรับเลี้ยงได้', style: TextStyle(fontSize: 16, color: Colors.white, fontWeight: FontWeight.bold)),
                    ),
                  )
              ];
            }()),
          ],
        ),
      ),
    );
  }
}