import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../config/api_config.dart';

class ConsiderApprovalScreen extends StatefulWidget {
  final int catId;
  final String catName;
  final Map<String, dynamic> adopter;

  const ConsiderApprovalScreen({
    super.key,
    required this.catId,
    required this.catName,
    required this.adopter,
  });

  @override
  State<ConsiderApprovalScreen> createState() => _ConsiderApprovalScreenState();
}

class _ConsiderApprovalScreenState extends State<ConsiderApprovalScreen> {
  bool _isLoading = true;
  Map<String, dynamic>? _catDetails;
  Map<String, dynamic>? _evaluationScores;
  final TextEditingController _remarkController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    try {
      // Fetch cat details
      final catRes = await http.get(Uri.parse(ApiConfig.baseUrl + '/cats/${widget.catId}'));
      if (catRes.statusCode == 200) {
        final catData = jsonDecode(catRes.body);
        if (catData['success'] == true && catData['data'] != null) {
          _catDetails = catData['data'];
        }
      }

      // Fetch evaluation scores
      final evalRes = await http.get(Uri.parse(ApiConfig.baseUrl + '/evaluate/${widget.adopter['user_id']}/${widget.catId}'));
      if (evalRes.statusCode == 200) {
        final evalData = jsonDecode(evalRes.body);
        if (evalData['success'] == true && evalData['data'] != null) {
          _evaluationScores = evalData['data'];
        }
      }
    } catch (e) {
      print("Error fetching data: $e");
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _updateStatus(String status) async {
    try {
      final response = await http.put(
        Uri.parse(ApiConfig.baseUrl + '/adoption/request/${widget.adopter['match_id']}/status'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'status': status}),
      );
      if (response.statusCode == 200) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('อัปเดตสถานะเป็น ${status == 'approved' ? 'อนุมัติ' : 'ไม่อนุมัติ'} สำเร็จ')),
        );
        Navigator.pop(context);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('เกิดข้อผิดพลาดในการอัปเดตสถานะ')),
        );
      }
    } catch (e) {
      print("Error updating status: $e");
    }
  }

  String _getMatchResultText(int percent) {
    if (percent >= 80) return 'มีความเหมาะสม';
    if (percent >= 50) return 'พอใช้';
    return 'ควรพิจารณาเพิ่มเติม';
  }

  Color _getMatchResultColor(int percent) {
    if (percent >= 80) return Colors.green;
    if (percent >= 50) return Colors.yellow;
    return Colors.red;
  }

  Widget _buildStarRow(String label, int score) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Row(
            mainAxisSize: MainAxisSize.min,
            children: List.generate(5, (index) {
              return Icon(
                index < score ? Icons.star : Icons.star_border,
                color: Colors.amber,
                size: 20,
              );
            }),
          ),
          const SizedBox(width: 16),
          SizedBox(
            width: 100,
            child: Text(label, style: const TextStyle(fontSize: 14)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final String currentStatus = widget.adopter['status'] ?? 'pending';
    final bool isAlreadyProcessed = currentStatus == 'approved' || currentStatus == 'rejected';

    return Scaffold(
      backgroundColor: const Color(0xFFFFF0F0),
      appBar: AppBar(
        backgroundColor: const Color(0xFFFFA0A0),
        elevation: 0,
        title: Text(currentStatus == 'approved' ? 'รายละเอียดผู้รับเลี้ยง' : 'พิจารณาคำขอรับเลี้ยง', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        centerTitle: true,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Colors.pink))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                children: [
                  // Cat Info Card
                  if (_catDetails != null)
                    Container(
                      width: double.infinity,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10)],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          ClipRRect(
                            borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
                            child: _catDetails!['image_url'] != null
                                ? Image.network(
                                    _catDetails!['image_url'],
                                    height: 150,
                                    width: double.infinity,
                                    fit: BoxFit.cover,
                                  )
                                : Container(
                                    height: 150,
                                    color: Colors.grey[200],
                                    child: const Center(child: Icon(Icons.pets, size: 50, color: Colors.grey)),
                                  ),
                          ),
                          Padding(
                            padding: const EdgeInsets.all(16.0),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(_catDetails!['pet_name'] ?? 'ไม่ทราบชื่อ', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                                Text("${_catDetails!['pet_breed'] ?? '-'} อายุ ${_catDetails!['age_months']} เดือน", style: TextStyle(color: Colors.grey[600], fontSize: 14)),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  const SizedBox(height: 20),

                  // Adopter Info Card
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16.0),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFEAEA),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        const Align(
                          alignment: Alignment.centerLeft,
                          child: Text("รายละเอียดผู้รับเลี้ยง", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                        ),
                        const SizedBox(height: 16),
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              width: 60,
                              height: 60,
                              decoration: const BoxDecoration(
                                shape: BoxShape.circle,
                                color: Colors.blueAccent,
                              ),
                              child: const Icon(Icons.person, color: Colors.white, size: 40),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text("ชื่อผู้ใช้: ${widget.adopter['fullname'] ?? '-'}", style: const TextStyle(fontWeight: FontWeight.bold)),
                                ],
                              ),
                            )
                          ],
                        ),
                        const SizedBox(height: 24),
                        
                        // Evaluation Badges
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: Colors.pink[200]!),
                          ),
                          child: const Text("ผลการประเมิน", style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                        ),
                        const SizedBox(height: 12),
                        
                        // Score Circle and Text
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Container(
                              width: 24,
                              height: 24,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: _getMatchResultColor((_evaluationScores?['matchPercent'] ?? widget.adopter['matchscore'] ?? 0).toInt()),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text("${_evaluationScores?['matchPercent'] ?? widget.adopter['matchscore'] ?? 0}%", style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                            const SizedBox(width: 16),
                            Text(_getMatchResultText((_evaluationScores?['matchPercent'] ?? widget.adopter['matchscore'] ?? 0).toInt()), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                          ],
                        ),
                        const SizedBox(height: 24),
                        
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: Colors.pink[200]!),
                          ),
                          child: const Text("คะแนนความเหมาะสม", style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                        ),
                        const SizedBox(height: 16),
                        
                        // Stars
                        _buildStarRow("ที่พักอาศัย", _evaluationScores?['scores']?['space'] ?? 0),
                        _buildStarRow("เวลาว่าง", _evaluationScores?['scores']?['time'] ?? 0),
                        _buildStarRow("ค่าใช้จ่าย", _evaluationScores?['scores']?['budget'] ?? 0),
                        _buildStarRow("ประสบการณ์", _evaluationScores?['scores']?['experience'] ?? 0),
                        const SizedBox(height: 24),

                        // Action Buttons
                        if (!isAlreadyProcessed) ...[
                          Row(
                            children: [
                              Expanded(
                                child: ElevatedButton(
                                  onPressed: () => _updateStatus('rejected'),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: Colors.red[400],
                                    padding: const EdgeInsets.symmetric(vertical: 16),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                                  ),
                                  child: const Text("ไม่อนุมัติ", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                                ),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: ElevatedButton(
                                  onPressed: () => _updateStatus('approved'),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: Colors.green,
                                    padding: const EdgeInsets.symmetric(vertical: 16),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                                  ),
                                  child: const Text("อนุมัติ", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 24),
                          const Align(
                            alignment: Alignment.centerLeft,
                            child: Text("หมายเหตุ/ข้อเสนอแนะการเลี้ยง", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                          ),
                          const SizedBox(height: 8),
                          TextField(
                            controller: _remarkController,
                            decoration: InputDecoration(
                              filled: true,
                              fillColor: Colors.white,
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(10),
                                borderSide: BorderSide.none,
                              ),
                            ),
                          ),
                        ] else ...[
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            decoration: BoxDecoration(
                              color: currentStatus == 'approved' ? Colors.green : Colors.red,
                              borderRadius: BorderRadius.circular(15),
                            ),
                            child: Center(
                              child: Text(
                                currentStatus == 'approved' ? "อนุมัติแล้ว" : "ไม่อนุมัติ",
                                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18),
                              ),
                            ),
                          )
                        ],
                        const SizedBox(height: 20),
                        OutlinedButton(
                          onPressed: () => Navigator.pop(context),
                          style: OutlinedButton.styleFrom(
                            backgroundColor: Colors.white,
                            side: const BorderSide(color: Colors.pinkAccent),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                            padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 12),
                          ),
                          child: const Text("ย้อนกลับ", style: TextStyle(color: Colors.black87, fontWeight: FontWeight.bold)),
                        )
                      ],
                    ),
                  )
                ],
              ),
            ),
    );
  }

  @override
  void dispose() {
    _remarkController.dispose();
    super.dispose();
  }
}
