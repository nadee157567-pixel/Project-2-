import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../config/api_config.dart';
import 'chat_message_screen.dart';
class AdoptionStatusScreen extends StatefulWidget {
  final Map<String, dynamic> evaluationResult;
  final String catImageUrl;
  final String status;
  final int userId;
  final int matchId;
  final int catId;

  const AdoptionStatusScreen({
    super.key,
    required this.evaluationResult,
    required this.catImageUrl,
    required this.status,
    required this.userId,
    required this.matchId,
    required this.catId,
  });

  @override
  State<AdoptionStatusScreen> createState() => _AdoptionStatusScreenState();
}

class _AdoptionStatusScreenState extends State<AdoptionStatusScreen> {
  Map<String, dynamic>? _realEvaluationResult;
  bool _isFetching = false;

  @override
  void initState() {
    super.initState();
    _realEvaluationResult = widget.evaluationResult;
    // Check if the passed result is fake (meaning scores are all 0 or empty)
    bool isFake = true;
    if (_realEvaluationResult != null) {
      if (_realEvaluationResult!.containsKey('scores') && _realEvaluationResult!['scores'] != null) {
        final s = _realEvaluationResult!['scores'];
        if (s['space'] != 0 || s['time'] != 0 || s['budget'] != 0 || s['experience'] != 0) {
          isFake = false;
        }
      } else if (_realEvaluationResult!.containsKey('score_detail') && _realEvaluationResult!['score_detail'] != null) {
        isFake = false;
      }
    }
    
    if (isFake) {
      _fetchRealEvaluation();
    }
  }

  Future<void> _fetchRealEvaluation() async {
    if (mounted) setState(() => _isFetching = true);
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}/matching/${widget.catId}');
      final response = await http.post(
        url,
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({"userId": widget.userId}),
      );

      if (response.statusCode == 200) {
        final jsonResponse = json.decode(response.body);
        if (jsonResponse['success'] == true && jsonResponse['data'] != null) {
          if (mounted) {
            setState(() {
              _realEvaluationResult = jsonResponse['data'];
            });
          }
        }
      }
    } catch (e) {
      print("Error fetching real evaluation: $e");
    } finally {
      if (mounted) {
        setState(() => _isFetching = false);
      }
    }
  }

  Future<void> _navigateToChat(BuildContext context) async {
    try {
      final res = await http.get(Uri.parse('${ApiConfig.baseUrl}/chats?userId=${widget.userId}'));
      if (res.statusCode == 200) {
        final data = json.decode(res.body);
        if (data['success']) {
          List chats = data['data'];
          // หาห้องแชทที่มี match_id ตรงกัน
          final chat = chats.firstWhere(
            (c) => c['match_id'].toString() == widget.matchId.toString(),
            orElse: () => null,
          );
          
          if (chat != null) {
            if (context.mounted) {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => ChatMessageScreen(
                    roomId: int.parse(chat['room_id'].toString()),
                    userId: widget.userId,
                    partnerName: chat['poster_name'] ?? 'ผู้โพสต์',
                  ),
                ),
              );
            }
          } else {
            if (context.mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('ยังไม่มีห้องแชทสำหรับรายการนี้ (รอระบบสร้างอัตโนมัติ)')),
              );
            }
          }
        }
      } else {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('เกิดข้อผิดพลาดในการดึงข้อมูลแชท')),
          );
        }
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    }
  }

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
    int matchPercent = 0;
    if (_realEvaluationResult != null) {
      if (_realEvaluationResult!.containsKey('matchPercent') && _realEvaluationResult!['matchPercent'] != null) {
        matchPercent = (double.tryParse(_realEvaluationResult!['matchPercent'].toString()) ?? 0).toInt();
      } else if (_realEvaluationResult!.containsKey('match_percentage') && _realEvaluationResult!['match_percentage'] != null) {
        matchPercent = (double.tryParse(_realEvaluationResult!['match_percentage'].toString()) ?? 0).toInt();
      }
    }

    int spaceScore = 0;
    int timeScore = 0;
    int budgetScore = 0;
    int expScore = 0;

    if (_realEvaluationResult != null) {
      if (_realEvaluationResult!.containsKey('scores') && _realEvaluationResult!['scores'] != null) {
        final s = _realEvaluationResult!['scores'];
        spaceScore = (double.tryParse(s['space']?.toString() ?? '0') ?? 0).toInt();
        timeScore = (double.tryParse(s['time']?.toString() ?? '0') ?? 0).toInt();
        budgetScore = (double.tryParse(s['budget']?.toString() ?? '0') ?? 0).toInt();
        expScore = (double.tryParse(s['experience']?.toString() ?? '0') ?? 0).toInt();
      } else if (_realEvaluationResult!.containsKey('score_detail') && _realEvaluationResult!['score_detail'] != null) {
        final sd = _realEvaluationResult!['score_detail'];
        spaceScore = (double.tryParse(sd['space']?['stars']?.toString() ?? '0') ?? 0).toInt();
        timeScore = (double.tryParse(sd['attention']?['stars']?.toString() ?? '0') ?? 0).toInt();
        budgetScore = (double.tryParse(sd['budget']?['stars']?.toString() ?? '0') ?? 0).toInt();
        expScore = (double.tryParse(sd['experience']?['stars']?.toString() ?? '0') ?? 0).toInt();
      }
    }

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
                      
                      // Stepper Logic based on status
                      Builder(
                        builder: (context) {
                          bool s1Comp = true, s1Act = false;
                          bool s2Comp = false, s2Act = false;
                          bool s3Comp = false, s3Act = false;
                          bool s4Comp = false, s4Act = false;

                          if (widget.status == 'pending') {
                            s1Comp = true;
                            s2Act = true;
                          } else if (widget.status == 'interview') {
                            s1Comp = true; s2Comp = true;
                            s3Act = true;
                          } else if (widget.status == 'approved' || widget.status == 'rejected') {
                            s1Comp = true; s2Comp = true; s3Comp = true; s4Comp = true;
                          }

                          return Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 16.0),
                            child: Row(
                              children: [
                                _buildStep("ส่งคำขอสำเร็จ", s1Comp, s1Act, false),
                                _buildStep("กำลังพิจารณา", s2Comp, s2Act, false),
                                _buildStep("พูดคุย/สัมภาษณ์", s3Comp, s3Act, false),
                                _buildStep("ทราบผล", s4Comp, s4Act, true),
                              ],
                            ),
                          );
                        }
                      ),
                      
                      const SizedBox(height: 30),
                      
                      // Hero Image and Title dynamic based on status
                      Builder(builder: (context) {
                        String iconUrl = 'https://cdn-icons-png.flaticon.com/512/3209/3209971.png';
                        String titleText = "ใบสมัครของคุณอยู่ระหว่างการพิจารณา";
                        String subtitleText = "ผู้โพสต์ได้รับข้อมูลการประเมินของคุณแล้ว\nกรุณารอการติดต่อกลับ หรือการอนุมัติเลี้ยงดู";
                        
                        if (widget.status == 'approved') {
                          iconUrl = 'https://cdn-icons-png.flaticon.com/512/1904/1904425.png'; // success
                          titleText = "ยินดีด้วย! คุณได้รับการอนุมัติ";
                          subtitleText = "ผู้โพสต์เลือกคุณเป็นผู้รับเลี้ยงน้องแมว\nกรุณาติดต่อนัดรับน้องแมวตามช่องทางที่ให้ไว้";
                        } else if (widget.status == 'rejected') {
                          iconUrl = 'https://cdn-icons-png.flaticon.com/512/1904/1904428.png'; // fail
                          titleText = "เสียใจด้วย ใบสมัครไม่ผ่านการอนุมัติ";
                          subtitleText = "ผู้โพสต์พิจารณาแล้วเห็นว่าอาจยังไม่เหมาะสมในขณะนี้\nแต่ยังมีน้องแมวอีกหลายตัวที่รอคุณอยู่!";
                        } else if (widget.status == 'interview') {
                          iconUrl = 'https://cdn-icons-png.flaticon.com/512/9374/9374944.png'; // interview
                          titleText = "ใบสมัครอยู่ระหว่างพิจารณาสัมภาษณ์";
                          subtitleText = "ผู้โพสต์กำลังพิจารณาและอาจติดต่อคุณเร็วๆนี้";
                        }
                        
                        return Column(
                          children: [
                            Image.network(
                              iconUrl,
                              height: 120,
                              errorBuilder: (context, error, stackTrace) => const Icon(Icons.pets, size: 80, color: Colors.orange),
                            ),
                            const SizedBox(height: 20),
                            Text(
                              titleText,
                              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF1C3A5B)),
                            ),
                            Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 32.0, vertical: 8.0),
                              child: Text(
                                subtitleText,
                                textAlign: TextAlign.center,
                                style: const TextStyle(fontSize: 12, color: Colors.black54, height: 1.5),
                              ),
                            ),
                          ],
                        );
                      }),
                      
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
                              child: widget.catImageUrl.isNotEmpty
                                  ? Image.network(
                                      widget.catImageUrl,
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
                                  _buildStarRow("ที่พักอาศัย", spaceScore),
                                  _buildStarRow("เวลาว่าง", timeScore),
                                  _buildStarRow("ค่าใช้จ่าย", budgetScore),
                                  _buildStarRow("ประสบการณ์", expScore),
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
            child: widget.status == 'rejected'
                ? SizedBox(
                    width: double.infinity,
                    child: OutlinedButton(
                      onPressed: () {
                        Navigator.pop(context);
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
                  )
                : Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () {
                            Navigator.pop(context);
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
                          onPressed: () => _navigateToChat(context),
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
