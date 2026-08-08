import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'adopter_profile_screen.dart';
import 'cat_evaluation_screen.dart';
import 'cat_profile_form_screen.dart';
import 'poster_profile_screen.dart';

class CatDetailScreen extends StatefulWidget {
  final int userId;
  final Map<String, dynamic> catData;

  const CatDetailScreen({super.key, required this.userId, required this.catData});

  @override
  State<CatDetailScreen> createState() => _CatDetailScreenState();
}

class _CatDetailScreenState extends State<CatDetailScreen> {
  bool _isLoading = false;

  void _handleEvaluationClick() {
    // เนื่องจากเราเช็คโปรไฟล์มาตั้งแต่หน้า HomeScreen แล้ว จึงไม่ต้องเช็คซ้ำ
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => EvaluationScreen(
          userId: widget.userId,
          catId: int.tryParse(widget.catData['cat_id'].toString()) ?? 0,
          catImageUrl: widget.catData['image_url'] ?? '',
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final cat = widget.catData;
    
    return Scaffold(
      backgroundColor: const Color(0xFFFFF5F5), // Pale pink background
      body: Stack(
        children: [
          SingleChildScrollView(
            child: Column(
              children: [
                // 1. Image Header
                Stack(
                  children: [
                    Container(
                      height: 350,
                      width: double.infinity,
                      decoration: BoxDecoration(
                        color: Colors.grey[300],
                        borderRadius: const BorderRadius.only(
                          bottomLeft: Radius.circular(30),
                          bottomRight: Radius.circular(30),
                        ),
                      ),
                      child: cat['image_url'] != null
                          ? ClipRRect(
                              borderRadius: const BorderRadius.only(
                                bottomLeft: Radius.circular(30),
                                bottomRight: Radius.circular(30),
                              ),
                              child: Image.network(
                                cat['image_url'],
                                fit: BoxFit.cover,
                                errorBuilder: (context, error, stackTrace) =>
                                    const Icon(Icons.pets, color: Colors.grey, size: 80),
                              ),
                            )
                          : const Icon(Icons.pets, size: 80, color: Colors.grey),
                    ),
                    // Back Button
                    Positioned(
                      top: 50,
                      left: 20,
                      child: GestureDetector(
                        onTap: () => Navigator.pop(context),
                        child: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: const BoxDecoration(
                            color: Colors.white,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.arrow_back, color: Colors.pinkAccent),
                        ),
                      ),
                    ),
                  ],
                ),
                
                // 2. Details Card
                Transform.translate(
                  offset: const Offset(0, -30), // Pull up to overlap image slightly
                  child: Container(
                    margin: const EdgeInsets.symmetric(horizontal: 20),
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(25),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.05),
                          blurRadius: 10,
                          offset: const Offset(0, 5),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Tag
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: Colors.green[50],
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: Colors.green[200]!),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Container(
                                width: 8,
                                height: 8,
                                decoration: const BoxDecoration(
                                  color: Colors.green,
                                  shape: BoxShape.circle,
                                ),
                              ),
                              const SizedBox(width: 6),
                              const Text("หาบ้าน", style: TextStyle(color: Colors.black87, fontWeight: FontWeight.bold, fontSize: 12)),
                            ],
                          ),
                        ),
                        const SizedBox(height: 16),
                        
                        // Name
                        Text(
                          cat['pet_name'] ?? 'ไม่ระบุชื่อ',
                          style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 12),
                        
                        // Specs
                        _buildDetailRow("เพศ", cat['gender'] == 'male' ? 'ผู้' : cat['gender'] == 'female' ? 'เมีย' : '-'),
                        _buildDetailRow("อายุ", "${cat['age_months']} เดือน"),
                        _buildDetailRow("สายพันธุ์", cat['pet_breed'] ?? '-'),
                        _buildDetailRow("เคยรับวัคซีนแล้ว", cat['is_vaccinated'] ?? '-'), // สมมติว่ามีฟิลด์นี้ในข้อมูล ถ้าไม่มีจะแสดง -
                        _buildDetailRow("ทำหมันแล้ว", cat['is_sterilized'] ?? '-'), // สมมติ
                        _buildDetailRow("ลักษณะนิสัย", cat['personality'] ?? '-'),
                        _buildDetailRow("สุขภาพ", cat['health_note'] ?? 'แข็งแรงดี'),
                      ],
                    ),
                  ),
                ),
                
                // 3. Requirements Card
                if (!(cat['status'] == 'adopted' && cat['poster_id'].toString() != widget.userId.toString())) ...[
                  Container(
                    margin: const EdgeInsets.symmetric(horizontal: 20),
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.05),
                          blurRadius: 10,
                          offset: const Offset(0, 5),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildReqRow("พื้นที่ที่ต้องการ", _mapSpace(cat['req_space_level'])),
                        const SizedBox(height: 8),
                        _buildReqRow("เวลาที่ต้องให้", _mapAttention(cat['req_attention'])),
                        const SizedBox(height: 8),
                        _buildReqRow("ค่าใช้จ่ายโดยประมาณ", "${cat['est_monthly_cost'] ?? '3,000'} บาท/เดือน"),
                      ],
                    ),
                  ),
                  
                  // 4. Poster Profile mini
                  if (cat['poster_id'].toString() != widget.userId.toString())
                    Padding(
                      padding: const EdgeInsets.only(right: 20, top: 10),
                      child: Align(
                        alignment: Alignment.centerRight,
                        child: GestureDetector(
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => PosterProfileScreen(
                                  posterId: int.tryParse(cat['poster_id'].toString()) ?? 0,
                                  currentUserId: widget.userId,
                                ),
                              ),
                            );
                          },
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Container(
                                padding: const EdgeInsets.all(4),
                                decoration: BoxDecoration(
                                  color: Colors.indigo[100],
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(Icons.person, size: 16, color: Colors.indigo),
                              ),
                              const SizedBox(width: 8),
                              Text(
                                "ดูโปรไฟล์ผู้โพสต์",
                                style: TextStyle(color: Colors.grey[600], fontSize: 12, decoration: TextDecoration.underline),
                              )
                            ],
                          ),
                        ),
                      ),
                    ),
                ],
                
                const SizedBox(height: 100), // Space for bottom button
              ],
            ),
          ),
          
          // 5. Evaluate / Edit Button (Bottom Fixed)
          Positioned(
            bottom: 30,
            left: 40,
            right: 40,
            child: cat['status'] == 'adopted' && cat['poster_id'].toString() != widget.userId.toString()
                ? Container(
                    padding: const EdgeInsets.symmetric(vertical: 18),
                    decoration: BoxDecoration(
                      color: Colors.grey[400],
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Center(
                      child: Text(
                        "ได้บ้านที่อบอุ่นแล้ว",
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                      ),
                    ),
                  )
                : ElevatedButton(
              onPressed: _isLoading ? null : () {
                if (cat['poster_id'].toString() == widget.userId.toString()) {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => CatProfileFormScreen(
                        userId: widget.userId,
                        editCatData: cat,
                      ),
                    ),
                  );
                } else {
                  _handleEvaluationClick();
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: cat['poster_id'].toString() == widget.userId.toString() ? Colors.pink[400] : const Color(0xFFFFB6B6),
                padding: const EdgeInsets.symmetric(vertical: 18),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                elevation: 5,
                shadowColor: Colors.pink.withOpacity(0.3),
              ),
              child: _isLoading 
                ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                : Text(
                    cat['poster_id'].toString() == widget.userId.toString() ? "แก้ไขข้อมูลแมว" : "ประเมินความเหมาะสมกับคุณ",
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: cat['poster_id'].toString() == widget.userId.toString() ? Colors.white : Colors.black87),
                  ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text("$label ", style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.black87)),
          Expanded(child: Text(value, style: TextStyle(fontSize: 15, color: Colors.grey[700]))),
        ],
      ),
    );
  }

  Widget _buildReqRow(String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text("$label ", style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.black87)),
        Expanded(child: Text(value, style: TextStyle(fontSize: 14, color: Colors.grey[700]))),
      ],
    );
  }

  String _mapSpace(String? val) {
    if (val == 'large') return "ต้องการพื้นที่กว้างหรือระบบเปิด";
    if (val == 'small') return "เลี้ยงในพื้นที่จำกัดได้ (คอนโด/หอพัก)";
    return "ต้องการพื้นที่พอประมาณ";
  }

  String _mapAttention(String? val) {
    if (val == 'large') return "ต้องการคนที่มีเวลาเล่นด้วย";
    if (val == 'small') return "ดูแลตัวเองได้ ไม่ติดคนมาก";
    return "ต้องการเวลาดูแลปานกลาง";
  }
}
