import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'adoption_status_screen.dart';

class AdoptionRequestsScreen extends StatefulWidget {
  final int userId;
  const AdoptionRequestsScreen({super.key, required this.userId});

  @override
  State<AdoptionRequestsScreen> createState() => _AdoptionRequestsScreenState();
}

class _AdoptionRequestsScreenState extends State<AdoptionRequestsScreen> {
  List<dynamic> _requests = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchRequests();
  }

  Future<void> _fetchRequests() async {
    try {
      final response = await http.get(Uri.parse('http://10.0.2.2:3000/api/adoption/adopter/${widget.userId}'));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        setState(() {
          _requests = data['data'];
        });
      }
    } catch (e) {
      print("Error fetching adoption requests: $e");
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFFF0F0),
      appBar: AppBar(
        backgroundColor: const Color(0xFFFFA0A0),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Row(
          mainAxisAlignment: MainAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.pets, color: Colors.white, size: 20),
            SizedBox(width: 8),
            Icon(Icons.pets, color: Colors.white, size: 28),
            SizedBox(width: 8),
            Icon(Icons.pets, color: Colors.white, size: 20),
          ],
        ),
        centerTitle: true,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Colors.pink))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                children: [
                  const SizedBox(height: 10),
                  const Text(
                    'คำขอรับเลี้ยงของคุณ',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 20),
                  if (_requests.isEmpty)
                    const Padding(
                      padding: EdgeInsets.all(32.0),
                      child: Text('ยังไม่มีคำขอรับเลี้ยง', style: TextStyle(color: Colors.grey, fontSize: 16)),
                    )
                  else
                    ..._requests.map((req) {
                      double matchscoreD = (req['matchscore'] != null) 
                          ? double.parse(req['matchscore'].toString()) 
                          : 0.0;
                      int score = matchscoreD.toInt();
                      
                      String resultText = score >= 80 ? 'มีความเหมาะสม' : (score >= 50 ? 'พอใช้' : 'ควรพิจารณาเพิ่มเติม');
                      String catName = req['pet_name'] ?? 'ไม่ทราบชื่อ';
                      String imageUrl = req['image_url'] ?? 'https://via.placeholder.com/150';
                      String status = req['status'] ?? 'pending';
                      
                      Map<String, dynamic> fakeEvaluationResult = {
                        'matchPercent': score,
                        'scores': {'space': 0, 'time': 0, 'budget': 0, 'experience': 0}
                      };

                      return Padding(
                        padding: const EdgeInsets.only(bottom: 20),
                        child: _buildRequestCard(
                          context: context,
                          imageUrl: imageUrl,
                          catName: catName,
                          score: score,
                          resultText: resultText,
                          status: status,
                          evaluationResult: fakeEvaluationResult,
                        ),
                      );
                    }).toList(),
                ],
              ),
            ),
    );
  }

  Widget _buildRequestCard({
    required BuildContext context,
    required String imageUrl,
    required String catName,
    required int score,
    required String resultText,
    required String status,
    required Map<String, dynamic> evaluationResult,
  }) {
    String displayStatus = status == 'pending' ? 'รอการพิจารณา' 
                        : status == 'interview' ? 'นัดสัมภาษณ์'
                        : status == 'approved' ? 'อนุมัติ'
                        : 'ปฏิเสธ';
    Color statusColor = status == 'pending' ? Colors.orange 
                        : status == 'interview' ? Colors.blue
                        : status == 'approved' ? Colors.green
                        : Colors.red;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
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
          ClipRRect(
            borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
            child: Image.network(
              imageUrl,
              height: 180,
              width: double.infinity,
              fit: BoxFit.cover,
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  flex: 3,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        catName,
                        style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.pinkAccent),
                      ),
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFFF0F0),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFFFFA0A0)),
                        ),
                        child: const Text('คะแนนจับคู่', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Icon(Icons.circle, color: score >= 80 ? Colors.green : Colors.yellow, size: 20),
                          const SizedBox(width: 8),
                          Text('$score%', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                          const SizedBox(width: 8),
                          Text(resultText, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Text('สถานะ: $displayStatus', style: TextStyle(fontWeight: FontWeight.bold, color: statusColor)),
                    ],
                  ),
                ),
                Expanded(
                  flex: 2,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      const SizedBox(height: 30),
                      ElevatedButton(
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => AdoptionStatusScreen(
                                evaluationResult: evaluationResult,
                                catImageUrl: imageUrl,
                              ),
                            ),
                          );
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFFFA0A0),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(20),
                          ),
                        ),
                        child: const Text('เช็คสถานะ', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                      ),
                    ],
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
