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

      // Fetch evaluation scores (saved assessment)
      final evalRes = await http.get(Uri.parse(ApiConfig.baseUrl + '/adoption/assessment/${widget.adopter['applicant_id'] ?? widget.adopter['user_id']}/${widget.catId}'));
      if (evalRes.statusCode == 200) {
        final evalData = jsonDecode(evalRes.body);
        if (evalData['success'] == true && evalData['data'] != null) {
          _evaluationScores = evalData['data'];
        }
      }
    } catch (e) {
      print("Error fetching data: $e");
    } finally {
      if (!mounted) return;
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _updateStatus(String status) async {
    try {
      final Map<String, dynamic> body = {'status': status};
      if (_remarkController.text.trim().isNotEmpty) {
        body['rejection_reason'] = _remarkController.text.trim();
      }
      
      final response = await http.put(
        Uri.parse(ApiConfig.baseUrl + '/adoption/request/${widget.adopter['match_id']}/status'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(body),
      );
      if (response.statusCode == 200) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('อัปเดตสถานะเป็น ${status == 'approved' ? 'ตกลงให้รับเลี้ยง' : 'ปฏิเสธคำขอ'} เรียบร้อยแล้ว 😻')),
        );
        Navigator.pop(context);
      } else {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('เกิดข้อผิดพลาดในการอัปเดตสถานะ')),
        );
      }
    } catch (e) {
      print("Error updating status: $e");
    }
  }

  void _showConfirmationDialog(String status) {
    _remarkController.clear();
    final bool isApprove = status == 'approved';
    final String title = isApprove ? 'ตกลงเลือกผู้รับเลี้ยงนี้ 🐾' : 'ปฏิเสธผู้รับเลี้ยง';
    final String confirmBtnText = isApprove ? 'ตกลง! มอบน้องแมวให้เลย' : 'ยืนยันปฏิเสธ';
    final Color confirmBtnColor = isApprove ? Colors.green : Colors.red;

    final List<String> approvalOptions = [
      'ยินดีด้วยน้าา คุณเหมาะสมกับน้องแมวมาก',
      'น้องแมวพร้อมให้มารับแล้วนะ',
      'ฝากดูแลน้องแมวด้วยนะ',
      'อื่นๆ(ระบุ)'
    ];

    final List<String> rejectionOptions = [
      'คุณสมบัติยังไม่ตรงตามที่ต้องการ',
      'เวลาที่มีให้น้องแมวอาจจะยังน้อยเกินไป',
      'สถานที่เลี้ยงอาจจะยังไม่เหมาะสม',
      'ไม่สามารถติดต่อได้',
      'อื่นๆ(ระบุ)'
    ];

    final List<String> options = isApprove ? approvalOptions : rejectionOptions;
    String? selectedOption;
    bool showError = false;

    showDialog(
      context: context,
      builder: (BuildContext context) {
        return StatefulBuilder(
          builder: (context, setState) {
            return AlertDialog(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
              title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    RichText(
                      text: TextSpan(
                        text: isApprove 
                            ? 'คุณแน่ใจไหมที่จะเลือกผู้ใช้คนนี้ไปดูแลน้องแมว? คุณสามารถฝากข้อความถึงว่าที่ทาสแมวคนใหม่ได้นะ '
                            : 'คุณต้องการปฏิเสธคำขอนี้ใช่ไหม? กรุณาระบุเหตุผลเพื่อแจ้งให้ผู้ขอทราบ ',
                        style: const TextStyle(color: Colors.black87, fontSize: 14),
                        children: const [
                          TextSpan(text: '*', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold, fontSize: 16)),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      decoration: InputDecoration(
                        filled: true,
                        fillColor: Colors.white,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide: BorderSide(color: showError && selectedOption == null ? Colors.red : Colors.grey[300]!),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide: BorderSide(color: showError && selectedOption == null ? Colors.red : Colors.grey[300]!),
                        ),
                      ),
                      hint: Text(isApprove ? 'เลือกข้อความแนะนำ...' : 'เลือกเหตุผลที่ปฏิเสธ...'),
                      value: selectedOption,
                      isExpanded: true,
                      items: options.map((String option) {
                        return DropdownMenuItem<String>(
                          value: option,
                          child: Text(option),
                        );
                      }).toList(),
                      onChanged: (String? newValue) {
                        setState(() {
                          selectedOption = newValue;
                          showError = false;
                          if (newValue != null && newValue != 'อื่นๆ(ระบุ)') {
                            _remarkController.text = newValue;
                          } else {
                            _remarkController.clear();
                          }
                        });
                      },
                    ),
                    if (showError && selectedOption == null)
                      const Padding(
                        padding: EdgeInsets.only(top: 8.0, left: 12.0),
                        child: Text('กรุณาเลือกตัวเลือก', style: TextStyle(color: Colors.red, fontSize: 12)),
                      ),
                    if (selectedOption == 'อื่นๆ(ระบุ)') ...[
                      const SizedBox(height: 12),
                      TextField(
                        controller: _remarkController,
                        maxLines: 3,
                        onChanged: (value) {
                          if (showError) setState(() => showError = false);
                        },
                        decoration: InputDecoration(
                          hintText: 'พิมพ์รายละเอียดเพิ่มเติมที่นี่...',
                          filled: true,
                          fillColor: Colors.grey[100],
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                            borderSide: showError && _remarkController.text.trim().isEmpty 
                                ? const BorderSide(color: Colors.red) 
                                : BorderSide.none,
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                            borderSide: showError && _remarkController.text.trim().isEmpty 
                                ? const BorderSide(color: Colors.red) 
                                : BorderSide.none,
                          ),
                        ),
                      ),
                      if (showError && _remarkController.text.trim().isEmpty)
                        const Padding(
                          padding: EdgeInsets.only(top: 8.0, left: 12.0),
                          child: Text('กรุณาระบุหมายเหตุ', style: TextStyle(color: Colors.red, fontSize: 12)),
                        ),
                    ],
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('ยกเลิก', style: TextStyle(color: Colors.grey)),
                ),
                ElevatedButton(
                  onPressed: () {
                    if (selectedOption == null || (selectedOption == 'อื่นๆ(ระบุ)' && _remarkController.text.trim().isEmpty)) {
                      setState(() {
                        showError = true;
                      });
                      return;
                    }
                    Navigator.pop(context);
                    _updateStatus(status);
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: confirmBtnColor,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  child: Text(confirmBtnText, style: const TextStyle(color: Colors.white)),
                ),
              ],
            );
          },
        );
      },
    );
  }

  String _getMatchResultText(int percent) {
    if (percent >= 80) return 'เหมาะสมมาก (ว่าที่ทาสแมวตัวจริง!)';
    if (percent >= 50) return 'พอใช้ (ลองพูดคุยกันดูก่อนได้น้า)';
    return 'อาจจะยังไม่เหมาะ';
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

    int matchPercent = 0;
    try {
      var rawScore = widget.adopter['matchscore'] ?? 0;
      matchPercent = double.parse(rawScore.toString()).toInt();
    } catch (e) {
      matchPercent = 0;
    }

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
                            child: () {
                              String? imageUrl = _catDetails!['image_url'];
                              if (imageUrl == null && _catDetails!['photos'] != null && (_catDetails!['photos'] as List).isNotEmpty) {
                                imageUrl = _catDetails!['photos'][0]['image_url'];
                              }
                              return imageUrl != null && imageUrl.isNotEmpty
                                  ? Image.network(
                                      ApiConfig.getImageUrl(imageUrl),
                                      height: 150,
                                      width: double.infinity,
                                      fit: BoxFit.cover,
                                    )
                                  : Container(
                                      height: 150,
                                      color: Colors.grey[200],
                                      child: const Center(child: Icon(Icons.pets, size: 50, color: Colors.grey)),
                                    );
                            }(),
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
                                color: _getMatchResultColor(matchPercent),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text("$matchPercent%", style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                            const SizedBox(width: 16),
                            Text(_getMatchResultText(matchPercent), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
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
                        _buildStarRow("ที่พักอาศัย", (double.tryParse(_evaluationScores?['score_detail']?['space']?['stars']?.toString() ?? '0') ?? 0).toInt()),
                        _buildStarRow("เวลาว่าง", (double.tryParse(_evaluationScores?['score_detail']?['attention']?['stars']?.toString() ?? '0') ?? 0).toInt()),
                        _buildStarRow("ค่าใช้จ่าย", (double.tryParse(_evaluationScores?['score_detail']?['budget']?['stars']?.toString() ?? '0') ?? 0).toInt()),
                        _buildStarRow("ประสบการณ์", (double.tryParse(_evaluationScores?['score_detail']?['experience']?['stars']?.toString() ?? '0') ?? 0).toInt()),
                        const SizedBox(height: 24),

                        // Action Buttons
                        if (!isAlreadyProcessed) ...[
                          Row(
                            children: [
                              Expanded(
                                child: ElevatedButton(
                                  onPressed: () => _showConfirmationDialog('rejected'),
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
                                  onPressed: () => _showConfirmationDialog('approved'),
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
                          ),
                          if (widget.adopter['rejection_reason'] != null && widget.adopter['rejection_reason'].toString().trim().isNotEmpty) ...[
                            const SizedBox(height: 12),
                            Container(
                              width: double.infinity,
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: currentStatus == 'approved' ? Colors.green.shade200 : Colors.red.shade200,
                                ),
                              ),
                              child: Builder(
                                builder: (context) {
                                  String reason = widget.adopter['rejection_reason'].toString().trim();
                                  if (reason == 'adopted_by_other') {
                                    reason = 'มีผู้รับเลี้ยงน้องแมวแล้ว';
                                  }
                                  return RichText(
                                    text: TextSpan(
                                      children: [
                                        TextSpan(
                                          text: '* ',
                                          style: TextStyle(
                                            color: currentStatus == 'approved' ? Colors.green : Colors.red,
                                            fontWeight: FontWeight.bold,
                                            fontSize: 16,
                                          ),
                                        ),
                                        TextSpan(
                                          text: currentStatus == 'approved' 
                                              ? 'ข้อความฝากถึง: $reason'
                                              : 'เหตุผล: $reason',
                                          style: const TextStyle(
                                            color: Colors.black87,
                                            fontSize: 14,
                                          ),
                                        ),
                                      ],
                                    ),
                                  );
                                }
                              ),
                            ),
                          ],
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