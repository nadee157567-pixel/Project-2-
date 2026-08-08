import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../config/api_config.dart';
import 'consider_approval_screen.dart';

class CatAdoptersListScreen extends StatefulWidget {
  final int catId;
  final String catName;
  final bool isAdopted;

  const CatAdoptersListScreen({
    super.key,
    required this.catId,
    required this.catName,
    this.isAdopted = false,
  });

  @override
  State<CatAdoptersListScreen> createState() => _CatAdoptersListScreenState();
}

class _CatAdoptersListScreenState extends State<CatAdoptersListScreen> {
  bool _isLoading = true;
  List<dynamic> _adopters = [];

  @override
  void initState() {
    super.initState();
    _fetchAdopters();
  }

  Future<void> _fetchAdopters() async {
    try {
      final response = await http.get(Uri.parse(ApiConfig.baseUrl + '/adoption/cat/${widget.catId}'));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true && data['data'] != null) {
          setState(() {
            _adopters = data['data'];
          });
        } else {
          setState(() { _adopters = []; });
        }
      }
    } catch (e) {
      print("Error fetching adopters: $e");
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  String _translateSpace(String? space) {
    if (space == 'condo') return 'คอนโด';
    if (space == 'house') return 'บ้านเดี่ยว';
    if (space == 'townhouse') return 'ทาวน์โฮม/ทาวน์เฮ้าส์';
    if (space == 'apartment') return 'อพาร์ทเม้นท์/หอพัก';
    return space ?? '-';
  }

  String _translateExperience(String? exp) {
    if (exp == 'beginner') return 'พื้นฐาน';
    if (exp == 'experienced') return 'ระดับสูง';
    if (exp == 'none') return 'ไม่มี';
    return exp ?? '-';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFFF0F0),
      appBar: AppBar(
        backgroundColor: const Color(0xFFFFA0A0),
        elevation: 0,
        title: Text(widget.isAdopted ? 'รายละเอียดผู้รับเลี้ยง' : 'ผู้ขอรับเลี้ยง: ${widget.catName}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        centerTitle: true,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Colors.pink))
          : _adopters.isEmpty
              ? const Center(child: Text("ยังไม่มีผู้ขอรับเลี้ยง", style: TextStyle(color: Colors.grey, fontSize: 16)))
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _adopters.length,
                  itemBuilder: (context, index) {
                    final adopter = _adopters[index];
                    if (widget.isAdopted && adopter['status'] != 'approved') {
                      return const SizedBox.shrink();
                    }
                    
                    String status = adopter['status'] ?? 'pending';
                    Color btnColor = status == 'approved' ? Colors.green : (status == 'rejected' ? Colors.red : const Color(0xFFFFA0A0));
                    String btnText = status == 'approved' ? 'อนุมัติ' : (status == 'rejected' ? 'ไม่อนุมัติ' : 'พิจารณาอนุมัติ');
                    return Card(
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                      elevation: 2,
                      margin: const EdgeInsets.only(bottom: 16),
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  adopter['fullname'] ?? 'ไม่ทราบชื่อ',
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: Colors.pink[100],
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Text(
                                    "คะแนน ${double.parse(adopter['matchscore'].toString()).toInt()}%",
                                    style: TextStyle(fontWeight: FontWeight.bold, color: Colors.pink[800]),
                                  ),
                                ),
                              ],
                            ),
                            const Divider(height: 24),
                            _buildInfoRow(Icons.home, "ที่พัก", _translateSpace(adopter['living_space_type'])),
                            _buildInfoRow(Icons.pets, "ประสบการณ์", _translateExperience(adopter['experience'])),
                            if (adopter['upload_remark'] != null && adopter['upload_remark'].toString().isNotEmpty)
                              Padding(
                                padding: const EdgeInsets.only(top: 12.0),
                                child: Text("หมายเหตุ: ${adopter['upload_remark']}", style: const TextStyle(fontStyle: FontStyle.italic, color: Colors.grey)),
                              ),
                            const SizedBox(height: 16),
                            Row(
                              children: [
                                Expanded(
                                  child: ElevatedButton.icon(
                                    onPressed: () {
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        const SnackBar(content: Text('กำลังติดต่อไปยังผู้ขอรับเลี้ยง...')),
                                      );
                                    },
                                    icon: const Icon(Icons.message, size: 18),
                                    label: const Text("ติดต่อ", style: TextStyle(fontSize: 12)),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: Colors.white,
                                      foregroundColor: Colors.pink,
                                      side: const BorderSide(color: Colors.pink),
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                      padding: const EdgeInsets.symmetric(vertical: 8),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: ElevatedButton(
                                    onPressed: widget.isAdopted ? null : () async {
                                      // ไปหน้า พิจารณาอนุมัติ
                                      await Navigator.push(
                                        context,
                                        MaterialPageRoute(
                                          builder: (context) => ConsiderApprovalScreen(
                                            catId: widget.catId,
                                            catName: widget.catName,
                                            adopter: adopter,
                                          ),
                                        ),
                                      );
                                      _fetchAdopters(); // โหลดข้อมูลใหม่เมื่อกลับมา
                                    },
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: btnColor,
                                      foregroundColor: Colors.white,
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                      padding: const EdgeInsets.symmetric(vertical: 8),
                                    ),
                                    child: Text(btnText, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        children: [
          Icon(icon, size: 16, color: Colors.grey[600]),
          const SizedBox(width: 8),
          Text("$label: ", style: const TextStyle(fontWeight: FontWeight.bold)),
          Expanded(child: Text(value)),
        ],
      ),
    );
  }
}
