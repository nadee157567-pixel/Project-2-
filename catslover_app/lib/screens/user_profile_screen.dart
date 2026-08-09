import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'edit_profile_screen.dart';
import 'adoption_requests_screen.dart';
import 'poster_dashboard_screen.dart';
import 'landing_screen.dart';
import '../config/api_config.dart';

class UserProfileScreen extends StatefulWidget {
  final int userId;
  final bool isPosterMode;

  const UserProfileScreen({super.key, required this.userId, this.isPosterMode = false});

  @override
  State<UserProfileScreen> createState() => _UserProfileScreenState();
}

class _UserProfileScreenState extends State<UserProfileScreen> {
  bool isLoading = true;
  Map<String, dynamic>? userData;
  Map<String, dynamic>? adopterData;

  @override
  void initState() {
    super.initState();
    fetchProfileData();
  }

  Future<void> fetchProfileData() async {
    setState(() {
      isLoading = true;
    });

    try {
      // 1. Fetch User Data
      final userRes = await http.get(Uri.parse(ApiConfig.baseUrl + '/auth/user/${widget.userId}'));
      if (userRes.statusCode == 200) {
        final data = json.decode(userRes.body);
        if (data['success'] == true && data['data'] != null) {
          userData = data['data'];
        }
      }

      // 2. Fetch Adopter Data
      final adopterRes = await http.get(Uri.parse(ApiConfig.baseUrl + '/adopters/profile/${widget.userId}'));
      if (adopterRes.statusCode == 200) {
        final data = json.decode(adopterRes.body);
        if (data['success'] == true && data['profile'] != null) {
          adopterData = data['profile'];
        }
      }

    } catch (e) {
      print('Error fetching profile: $e');
    } finally {
      setState(() {
        isLoading = false;
      });
    }
  }

  String formatDate(String? dateStr) {
    if (dateStr == null) return '-';
    try {
      DateTime dt = DateTime.parse(dateStr);
      return '${dt.day.toString().padLeft(2, '0')}/${dt.month.toString().padLeft(2, '0')}/${dt.year + 543}';
    } catch (e) {
      return dateStr;
    }
  }

  // Helper mapping for display
  String displayHousing(String? val) {
    if (val == 'house') return 'บ้านเดี่ยว';
    if (val == 'condo') return 'คอนโด';
    if (val == 'apartment') return 'หอพัก';
    return val ?? '-';
  }

  String displayFreeTime(dynamic val) {
    if (val == null) return '-';
    int? intVal = val is int ? val : int.tryParse(val.toString());
    if (intVal == null) return '-';
    if (intVal <= 2) return 'น้อยกว่า 2 ชั่วโมง';
    if (intVal <= 4) return '2 - 4 ชั่วโมง';
    return 'มากกว่า 4 ชั่วโมง';
  }

  String displayBudget(dynamic val) {
    if (val == null) return '-';
    double? doubleVal = val is double ? val : (val is int ? val.toDouble() : double.tryParse(val.toString()));
    if (doubleVal == null) return '-';
    if (doubleVal <= 1000) return 'น้อย';
    if (doubleVal <= 3000) return 'ปานกลาง';
    return 'มาก';
  }

  String displayExp(String? val) {
    if (val == 'none') return 'ไม่มี';
    if (val == 'beginner') return 'พื้นฐาน';
    if (val == 'experienced') return 'ระดับสูง';
    return val ?? '-';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFFF5F5),
      appBar: AppBar(
        title: const Text('โปรไฟล์ของคุณ', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
        backgroundColor: const Color(0xFFFFF5F5),
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.black),
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // User Info Card
                  Container(
                    padding: const EdgeInsets.all(16.0),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16.0),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.05),
                          blurRadius: 10,
                          offset: const Offset(0, 5),
                        ),
                      ],
                    ),
                    child: Column(
                      children: [
                        CircleAvatar(
                          radius: 40,
                          backgroundColor: Colors.brown[300],
                          child: const Icon(Icons.person, size: 50, color: Colors.white),
                        ),
                        const SizedBox(height: 16),
                        _buildInfoRow('ชื่อผู้ใช้', userData?['username'] ?? '-'),
                        _buildInfoRow('email', userData?['email'] ?? '-'),
                        _buildInfoRow('เบอร์โทร', userData?['phonenumber'] ?? '-'),
                        _buildInfoRow('วันที่สมัครสมาชิก', formatDate(userData?['created_at'])),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),
                  // Adopter Info Card
                  Container(
                    padding: const EdgeInsets.all(16.0),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16.0),
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
                        _buildAdopterRow('🏡', 'ที่พักอาศัย', displayHousing(adopterData?['living_space_type'])),
                        _buildAdopterRow('⏳', 'เวลาว่างต่อวัน', displayFreeTime(adopterData?['daily_free_hours'])),
                        _buildAdopterRow('💰', 'งบประมาณต่อเดือน', displayBudget(adopterData?['max_monthly_budget'])),
                        _buildAdopterRow('🎓', 'ประสบการณ์', displayExp(adopterData?['experience'])),
                        _buildAdopterRow('👶', 'เด็กเล็กในบ้าน/แพ้ขนแมว', (adopterData?['has_children']?.toString() == '1') ? 'มี' : 'ไม่มี'),
                        _buildAdopterRow('🐶', 'สัตว์เลี้ยงอื่น', (adopterData?['has_other_pets']?.toString() == '1') ? 'มี' : 'ไม่มี'),
                        const SizedBox(height: 16),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            ElevatedButton(
                              onPressed: () async {
                                final result = await Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) => EditProfileScreen(
                                      userId: widget.userId,
                                      userData: userData,
                                      adopterData: adopterData,
                                    ),
                                  ),
                                );
                                if (result == true) {
                                  fetchProfileData();
                                }
                              },
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.pink[400],
                                foregroundColor: Colors.white,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(20),
                                ),
                              ),
                              child: const Text('แก้ไขข้อมูล'),
                            ),
                            const SizedBox(width: 16),
                            ElevatedButton.icon(
                              onPressed: () {
                                // Logout action - Go back to landing screen, remove all routes
                                Navigator.pushAndRemoveUntil(
                                  context,
                                  MaterialPageRoute(builder: (context) => const LandingScreen()),
                                  (route) => false,
                                );
                              },
                              icon: const Icon(Icons.logout, size: 18),
                              label: const Text('ออกจากระบบ'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.red[400],
                                foregroundColor: Colors.white,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(20),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 30),
                  ElevatedButton(
                    onPressed: () {
                      if (widget.isPosterMode) {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => PosterDashboardScreen(userId: widget.userId),
                          ),
                        );
                      } else {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => AdoptionRequestsScreen(userId: widget.userId),
                          ),
                        );
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.pink[400],
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: Text(
                      widget.isPosterMode ? 'สัตว์เลี้ยงที่ประกาศหาบ้าน' : 'ดูคำขอรับเลี้ยงทั้งหมดของคุณ',
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text('$label : ', style: const TextStyle(fontWeight: FontWeight.bold)),
          Text(value),
        ],
      ),
    );
  }

  Widget _buildAdopterRow(String emoji, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6.0),
      child: Row(
        children: [
          Text(emoji, style: const TextStyle(fontSize: 18)),
          const SizedBox(width: 8),
          Expanded(
            child: RichText(
              text: TextSpan(
                style: const TextStyle(color: Colors.black, fontSize: 15),
                children: [
                  TextSpan(text: '$label : ', style: const TextStyle(fontWeight: FontWeight.bold)),
                  TextSpan(text: value),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
