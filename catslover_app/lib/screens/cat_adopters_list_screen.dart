import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../config/api_config.dart';
import 'consider_approval_screen.dart';
import 'chat_message_screen.dart';
class CatAdoptersListScreen extends StatefulWidget {
  final int catId;
  final String catName;
  final bool isAdopted;
  final int posterId;

  const CatAdoptersListScreen({
    super.key,
    required this.catId,
    required this.catName,
    this.isAdopted = false,
    required this.posterId,
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

  Future<void> _navigateToChat(BuildContext context, Map<String, dynamic> adopter) async {
    try {
      final res = await http.get(Uri.parse('${ApiConfig.baseUrl}/chats?userId=${widget.posterId}'));
      if (res.statusCode == 200) {
        final data = json.decode(res.body);
        if (data['success']) {
          List chats = data['data'];
          // หาห้องแชทที่มี applicant_id กับ poster_id ตรงกัน
          final chat = chats.firstWhere(
            (c) => c['applicant_id'].toString() == adopter['applicant_id'].toString() &&
                   c['poster_id'].toString() == widget.posterId.toString(),
            orElse: () => null,
          );
          
          if (chat != null) {
            if (context.mounted) {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => ChatMessageScreen(
                    roomId: int.parse(chat['room_id'].toString()),
                    userId: widget.posterId,
                    partnerName: adopter['fullname'] ?? 'ผู้ขอรับเลี้ยง',
                  ),
                ),
              );
            }
          } else {
            // สร้างห้องแชทใหม่ผ่าน API
            final createRes = await http.post(
              Uri.parse('${ApiConfig.baseUrl}/chats/room'),
              headers: {'Content-Type': 'application/json'},
              body: json.encode({'matchId': adopter['match_id']}),
            );
            
            if (createRes.statusCode == 201) {
              final createData = json.decode(createRes.body);
              if (createData['success'] && context.mounted) {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => ChatMessageScreen(
                      roomId: int.parse(createData['roomId'].toString()),
                      userId: widget.posterId,
                      partnerName: adopter['fullname'] ?? 'ผู้ขอรับเลี้ยง',
                    ),
                  ),
                );
              }
            } else {
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('ไม่สามารถสร้างห้องแชทได้')),
                );
              }
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
                                    onPressed: () => _navigateToChat(context, adopter),
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
