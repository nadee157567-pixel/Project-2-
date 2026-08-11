import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'adopter_profile_screen.dart';
import 'cat_evaluation_screen.dart';
import 'cat_profile_form_screen.dart';
import 'poster_profile_screen.dart';
import '../config/api_config.dart';

class CatDetailScreen extends StatefulWidget {
  final int userId;
  final Map<String, dynamic> catData;

  const CatDetailScreen({super.key, required this.userId, required this.catData});

  @override
  State<CatDetailScreen> createState() => _CatDetailScreenState();
}

class _CatDetailScreenState extends State<CatDetailScreen> {
  bool _isLoading = false;
  Map<String, dynamic>? _currentCat;

  @override
  void initState() {
    super.initState();
    _currentCat = widget.catData;
    _loadCatDetails();
  }

  Future<void> _loadCatDetails() async {
    try {
      final response = await http.get(
        Uri.parse(ApiConfig.baseUrl + '/cats/${widget.catData['cat_id']}')
      );
      if (response.statusCode == 200) {
        final resData = json.decode(response.body);
        if (resData['success'] == true && resData['data'] != null) {
          if (!mounted) return;
          setState(() {
            _currentCat = resData['data'];
          });
        }
      }
    } catch (e) {
      print("Error loading cat details: $e");
    }
  }

  void _handleEvaluationClick() {
    final cat = _currentCat ?? widget.catData;
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => EvaluationScreen(
          userId: widget.userId,
          catId: int.tryParse(cat['cat_id'].toString()) ?? 0,
          catImageUrl: cat['image_url'] ?? '',
        ),
      ),
    );
  }

  Future<void> _deleteCat() async {
    final cat = _currentCat ?? widget.catData;
    final catName = cat['pet_name'] ?? 'แมว';

    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Row(
          children: [
            Icon(Icons.warning_amber_rounded, color: Colors.red, size: 28),
            SizedBox(width: 8),
            Text('ยืนยันการลบ', style: TextStyle(fontWeight: FontWeight.bold)),
          ],
        ),
        content: Text(
          'คุณต้องการลบข้อมูลน้อง$catName ออกจากระบบใช่ไหม?\nการลบจะไม่สามารถกู้คืนได้',
          style: const TextStyle(fontSize: 15),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('ยกเลิก', style: TextStyle(color: Colors.grey, fontSize: 15)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red[400],
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('ลบ', style: TextStyle(color: Colors.white, fontSize: 15)),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    setState(() => _isLoading = true);
    try {
      final response = await http.delete(
        Uri.parse('${ApiConfig.baseUrl}/cats/${cat['cat_id']}'),
      );
      if (!mounted) return;
      if (response.statusCode == 200) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('ลบน้อง$catName เรียบร้อยแล้ว'),
            backgroundColor: Colors.green[400],
          ),
        );
        Navigator.pop(context, true); // กลับพร้อม refresh
      } else {
        final errData = jsonDecode(response.body);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(errData['message'] ?? 'ลบไม่สำเร็จ'),
            backgroundColor: Colors.red[400],
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('เกิดข้อผิดพลาด: $e'), backgroundColor: Colors.red[400]),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cat = _currentCat ?? widget.catData;

    final bool isOwner = cat['poster_id'].toString() == widget.userId.toString();
    final bool isAvailable = cat['status'] == 'available';
    final bool isAdopted = cat['status'] == 'adopted';

    return Scaffold(
      backgroundColor: const Color(0xFFFFF5F5),
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
                                ApiConfig.getImageUrl(cat['image_url']),
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
                  offset: const Offset(0, -30),
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
                        // Status Tag
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
                        _buildDetailRow("อายุ", _mapAgeRange(cat['age_months'])),
                        _buildDetailRow("สายพันธุ์", cat['pet_breed'] ?? '-'),
                        _buildDetailRow("เคยรับวัคซีนแล้ว", cat['is_vaccinated'] ?? '-'),
                        _buildDetailRow("ทำหมันแล้ว", cat['is_sterilized'] ?? '-'),
                        _buildDetailRow("ลักษณะนิสัย", _mapPersonality(cat)),
                        _buildDetailRow("สุขภาพ", cat['health_note'] ?? 'แข็งแรงดี'),
                      ],
                    ),
                  ),
                ),

                // 3. Requirements Card
                if (!(isAdopted && !isOwner)) ...[
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
                  if (!isOwner)
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

                const SizedBox(height: 110), // Space for bottom button(s)
              ],
            ),
          ),

          // 5. Action Buttons (Bottom Fixed)
          Positioned(
            bottom: 30,
            left: 20,
            right: 20,
            child: _buildBottomButtons(isOwner, isAvailable, isAdopted, cat),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomButtons(bool isOwner, bool isAvailable, bool isAdopted, Map<String, dynamic> cat) {
    // ── ผู้โพสต์ดูแมวตัวเอง ──
    if (isOwner) {
      if (isAdopted) {
        // ได้บ้านแล้ว: ล็อกทุกปุ่ม
        return Container(
          padding: const EdgeInsets.symmetric(vertical: 18),
          decoration: BoxDecoration(
            color: Colors.grey[400],
            borderRadius: BorderRadius.circular(20),
          ),
          child: const Center(
            child: Text(
              'ได้บ้านที่อบอุ่นแล้ว',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
            ),
          ),
        );
      }

      // สถานะ available (หาบ้าน): แสดง 2 ปุ่ม
      return Row(
        children: [
          // ── ปุ่มแก้ไข ──
          Expanded(
            flex: 3,
            child: ElevatedButton.icon(
              onPressed: _isLoading
                  ? null
                  : () async {
                      await Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => CatProfileFormScreen(
                            userId: widget.userId,
                            editCatData: cat,
                          ),
                        ),
                      );
                      _loadCatDetails();
                    },
              icon: const Icon(Icons.edit_outlined, color: Colors.white, size: 20),
              label: _isLoading
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : const Text(
                      'แก้ไขข้อมูล',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                    ),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.pink[400],
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                elevation: 4,
              ),
            ),
          ),
          const SizedBox(width: 12),
          // ── ปุ่มลบ ──
          Expanded(
            flex: 2,
            child: ElevatedButton.icon(
              onPressed: _isLoading ? null : _deleteCat,
              icon: const Icon(Icons.delete_outline, color: Colors.white, size: 20),
              label: const Text(
                'ลบแมว',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red[400],
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                elevation: 4,
              ),
            ),
          ),
        ],
      );
    }

    // ── ผู้ดูทั่วไป ──
    if (isAdopted) {
      return Container(
        padding: const EdgeInsets.symmetric(vertical: 18),
        decoration: BoxDecoration(
          color: Colors.grey[400],
          borderRadius: BorderRadius.circular(20),
        ),
        child: const Center(
          child: Text(
            'ได้บ้านที่อบอุ่นแล้ว',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
          ),
        ),
      );
    }

    return ElevatedButton(
      onPressed: _isLoading ? null : _handleEvaluationClick,
      style: ElevatedButton.styleFrom(
        backgroundColor: const Color(0xFFFFB6B6),
        padding: const EdgeInsets.symmetric(vertical: 18),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        elevation: 5,
        shadowColor: Colors.pink.withOpacity(0.3),
      ),
      child: _isLoading
          ? const SizedBox(
              height: 20,
              width: 20,
              child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
          : const Text(
              'ประเมินความเหมาะสมกับคุณ',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.black87),
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
    if (val == 'large' || val == 'high') return "ต้องการพื้นที่กว้างหรือระบบเปิด";
    if (val == 'small' || val == 'low') return "เลี้ยงในพื้นที่จำกัดได้ (คอนโด/หอพัก)";
    return "ต้องการพื้นที่พอประมาณ";
  }

  String _mapAttention(String? val) {
    if (val == 'large' || val == 'high') return "ต้องการคนที่มีเวลาเล่นด้วย";
    if (val == 'small' || val == 'low') return "ดูแลตัวเองได้ ไม่ติดคนมาก";
    return "ต้องการเวลาดูแลปานกลาง";
  }

  String _mapAgeRange(dynamic ageMonths) {
    if (ageMonths == null) return '-';
    int age = int.tryParse(ageMonths.toString()) ?? 12;
    if (age < 2) return "ต่ำกว่า 2 เดือน (ยังไม่หย่านม)";
    if (age <= 6) return "2 - 6 เดือน (ลูกแมว)";
    if (age <= 12) return "มากกว่า 6 เดือน - 1 ปี (แมววัยรุ่น)";
    if (age <= 84) return "มากกว่า 1 ปี - 7 ปี (แมวโตเต็มวัย)";
    return "มากกว่า 7 ปี (แมวสูงวัย)";
  }

  String _mapPersonality(Map<String, dynamic> cat) {
    String p = cat['personality'] ?? '-';
    if (p.contains('เข้ากันได้ดี')) {
      List<String> list = [];
      if (cat['good_with_cats']?.toString() == '1' || cat['good_with_cats']?.toString() == 'true') {
        list.add('แมว');
      }
      if (cat['good_with_dogs']?.toString() == '1' || cat['good_with_dogs']?.toString() == 'true') {
        list.add('สุนัข');
      }
      if (list.isNotEmpty) {
        return "เข้ากับสัตว์อื่น: เข้ากันได้ดี (${list.join(', ')})";
      }
    }
    return p;
  }
}
