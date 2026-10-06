import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'edit_profile_screen.dart';
import 'adoption_requests_screen.dart';
import 'poster_dashboard_screen.dart';
import 'landing_screen.dart';
import '../config/api_config.dart';
import 'poster_cats_screen.dart';

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
      if (!mounted) return;
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
  String displaySpaceSize(String? val) {
    if (val == 'large') return 'กว้างขวาง';
    if (val == 'small') return 'คับแคบ';
    if (val == 'medium') return 'ปานกลาง';
    return val ?? '-';
  }

  String displayHousing(String? val) {
    if (val == 'house') return 'บ้านเดี่ยว';
    if (val == 'condo') return 'คอนโด';
    if (val == 'apartment') return 'หอพัก';
    return val ?? '-';
  }

  String displayFreeTime(dynamic val) {
    if (val == null) return '-';
    String strVal = val.toString();
    if (strVal == 'low') return 'น้อย';
    if (strVal == 'medium') return 'ปานกลาง';
    if (strVal == 'high') return 'มาก';
    // Fallback for old numeric data if any
    int? intVal = int.tryParse(strVal);
    if (intVal != null) {
      if (intVal <= 2) return 'น้อย';
      if (intVal <= 4) return 'ปานกลาง';
      return 'มาก';
    }
    return strVal;
  }

  String displayBudget(dynamic val) {
    if (val == null) return '-';
    String strVal = val.toString();
    if (strVal == 'low') return 'น้อย';
    if (strVal == 'medium') return 'ปานกลาง';
    if (strVal == 'high') return 'มาก';
    // Fallback for old numeric data if any
    double? doubleVal = double.tryParse(strVal);
    if (doubleVal != null) {
      if (doubleVal <= 1000) return 'น้อย';
      if (doubleVal <= 3000) return 'ปานกลาง';
      return 'มาก';
    }
    return strVal;
  }

  String displayExp(String? val) {
    if (val == 'low' || val == 'none') return 'ไม่มี';
    if (val == 'medium' || val == 'beginner') return 'พื้นฐาน';
    if (val == 'high' || val == 'experienced') return 'ระดับสูง';
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
                        _buildInfoRow('ชื่อ-นามสกุล', userData?['fullname'] ?? '-'),
                        _buildInfoRow('email', userData?['email'] ?? '-'),
                        _buildInfoRow('เบอร์โทร', userData?['phonenumber'] ?? '-'),
                        _buildInfoRow('Line ID', userData?['line_id'] ?? '-'),
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
                        _buildAdopterRow('📏', 'ขนาดพื้นที่', displaySpaceSize(adopterData?['space_size'])),
                        _buildAdopterRow('⏳', 'เวลาว่างต่อวัน', displayFreeTime(adopterData?['daily_free_hours'])),
                        _buildAdopterRow('💰', 'งบประมาณต่อเดือน', displayBudget(adopterData?['max_monthly_budget'])),
                        _buildAdopterRow('🎓', 'ประสบการณ์', displayExp(adopterData?['experience'])),
                        _buildAdopterRow('👶', 'เด็กเล็กในบ้าน', (adopterData?['has_children']?.toString() == '1') ? 'มี' : 'ไม่มี'),
                        _buildAdopterRow('🐶', 'สัตว์เลี้ยงอื่น', (adopterData?['has_other_pets']?.toString() == '1') ? 'มี' : 'ไม่มี'),
                        _buildAdopterRow('🏥', 'พร้อมดูแลแมวพิเศษ', (adopterData?['accepts_special_needs']?.toString() == '1') ? 'พร้อม' : 'ไม่พร้อม'),
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
                        const SizedBox(height: 16),
                        Center(
                          child: OutlinedButton.icon(
                            onPressed: () => _showBlockedUsers(context),
                            icon: const Icon(Icons.block, size: 18),
                            label: const Text('บัญชีที่บล็อก'),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: Colors.grey[700],
                              side: BorderSide(color: Colors.grey[400]!),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(20),
                              ),
                              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 10),
                            ),
                          ),
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
                            builder: (context) => PosterCatsScreen(userId: widget.userId),
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

  void _showBlockedUsers(BuildContext context) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return FutureBuilder(
          future: http.get(Uri.parse('${ApiConfig.baseUrl}/blocks/${widget.userId}')),
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const SizedBox(height: 300, child: Center(child: CircularProgressIndicator()));
            }
            if (!snapshot.hasData || snapshot.hasError) {
              return const SizedBox(height: 300, child: Center(child: Text("ไม่สามารถโหลดข้อมูลได้")));
            }
            final data = json.decode((snapshot.data as http.Response).body);
            List blockedUsers = data['data'] ?? [];

            return Container(
              padding: const EdgeInsets.symmetric(vertical: 20),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text("บัญชีที่บล็อก", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  const Divider(),
                  if (blockedUsers.isEmpty)
                    const Padding(
                      padding: EdgeInsets.all(32.0),
                      child: Text("ไม่มีบัญชีที่บล็อก", style: TextStyle(color: Colors.grey)),
                    )
                  else
                    Expanded(
                      child: ListView.builder(
                        itemCount: blockedUsers.length,
                        itemBuilder: (context, index) {
                          final user = blockedUsers[index];
                          return ListTile(
                            leading: CircleAvatar(
                              backgroundColor: Colors.grey[300],
                              child: const Icon(Icons.person, color: Colors.white),
                            ),
                            title: Text(user['fullname'] ?? user['username'] ?? 'User'),
                            trailing: TextButton(
                              onPressed: () async {
                                final confirm = await showDialog<bool>(
                                  context: context,
                                  builder: (context) => AlertDialog(
                                    title: const Text('ปลดบล็อก'),
                                    content: Text('ต้องการปลดบล็อก ${user['fullname']} หรือไม่?'),
                                    actions: [
                                      TextButton(
                                        onPressed: () => Navigator.pop(context, false),
                                        child: const Text('ยกเลิก', style: TextStyle(color: Colors.grey)),
                                      ),
                                      TextButton(
                                        onPressed: () => Navigator.pop(context, true),
                                        child: const Text('ปลดบล็อก', style: TextStyle(color: Colors.green)),
                                      ),
                                    ],
                                  ),
                                );

                                if (confirm == true) {
                                  await http.delete(Uri.parse('${ApiConfig.baseUrl}/blocks/${widget.userId}/${user['blocked_id']}'));
                                  Navigator.pop(context); // Close modal
                                  _showBlockedUsers(this.context); // Re-open to refresh
                                }
                              },
                              child: const Text('ปลดบล็อก', style: TextStyle(color: Colors.red)),
                            ),
                          );
                        },
                      ),
                    ),
                ],
              ),
            );
          },
        );
      },
    );
  }
}
