import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'cat_profile_form_screen.dart';
import 'cat_detail_screen.dart';
import 'cat_detail_screen.dart';
import 'user_profile_screen.dart';
import 'cat_adopters_list_screen.dart';
import 'adoption_requests_screen.dart';
import '../config/api_config.dart';

class PosterDashboardScreen extends StatefulWidget {
  final int userId;
  const PosterDashboardScreen({super.key, required this.userId});

  @override
  State<PosterDashboardScreen> createState() => _PosterDashboardScreenState();
}

class _PosterDashboardScreenState extends State<PosterDashboardScreen> {
  Map<String, dynamic>? _userProfile;
  List _availableCats = [];
  List _pendingCats = [];
  List _adoptedCats = [];
  bool _isLoading = true;
  bool _hasNotification = false;

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    setState(() => _isLoading = true);
    try {
      // 1. Fetch User Profile
      final userRes = await http.get(Uri.parse(ApiConfig.baseUrl + '/auth/user/${widget.userId}'));
      if (userRes.statusCode == 200) {
        final userData = jsonDecode(userRes.body);
        if (userData['success'] == true && userData['data'] != null) {
          _userProfile = userData['data'];
        }
      }

      // 2. Fetch Poster Cats
      final catRes = await http.get(Uri.parse(ApiConfig.baseUrl + '/cats/poster/${widget.userId}'));
      if (catRes.statusCode == 200) {
        final catData = jsonDecode(catRes.body);
        if (catData['success'] == true && catData['data'] != null) {
          final cats = catData['data'] as List;
          _availableCats = cats.where((c) => c['status'] == 'available' || c['status'] == 'pending').toList();
          _pendingCats = []; // No longer used as a separate list
          _adoptedCats = cats.where((c) => c['status'] == 'adopted').toList();
        }
      }
      // 3. Fetch Notifications Count
      final notifRes = await http.get(Uri.parse(ApiConfig.baseUrl + '/notifications/unread-counts/${widget.userId}'));
      if (notifRes.statusCode == 200) {
        final notifData = jsonDecode(notifRes.body);
        if (notifData['success'] == true) {
          _hasNotification = (notifData['unreadNotifications'] ?? 0) > 0;
        }
      }

    } catch (e) {
      print("Error fetching dashboard data: $e");
    } finally {
      if (!mounted) return;
      if (mounted) setState(() {
        _isLoading = false;
      });
    }
  }

  void _showNotificationsBottomSheet() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return FutureBuilder(
          future: http.get(Uri.parse(ApiConfig.baseUrl + '/notifications/${widget.userId}')),
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const SizedBox(
                height: 300,
                child: Center(child: CircularProgressIndicator()),
              );
            }
            if (!snapshot.hasData || snapshot.hasError) {
              return const SizedBox(
                height: 300,
                child: Center(child: Text("ไม่สามารถดึงข้อมูลได้")),
              );
            }

            final data = json.decode((snapshot.data as http.Response).body);
            List notifications = data['data'] ?? [];

            return Container(
              padding: const EdgeInsets.symmetric(vertical: 20),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text("การแจ้งเตือน", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  const Divider(),
                  if (notifications.isEmpty)
                    const Padding(
                      padding: EdgeInsets.all(32.0),
                      child: Text("ไม่มีการแจ้งเตือนใหม่", style: TextStyle(color: Colors.grey)),
                    )
                  else
                    Expanded(
                      child: ListView.builder(
                        itemCount: notifications.length,
                        itemBuilder: (itemContext, index) {
                          final notif = notifications[index];
                          bool isRead = notif['is_read'] == 1;
                          return ListTile(
                            leading: CircleAvatar(
                              backgroundColor: isRead ? Colors.grey[200] : Colors.pink[100],
                              child: Icon(
                                Icons.notifications,
                                color: isRead ? Colors.grey : Colors.pink[400],
                              ),
                            ),
                            title: Text(notif['title'] ?? 'แจ้งเตือน', style: TextStyle(fontWeight: isRead ? FontWeight.normal : FontWeight.bold)),
                            subtitle: Text(notif['message'] ?? ''),
                            trailing: Text(
                              _formatJoinedDate(notif['created_at']),
                              style: const TextStyle(fontSize: 12, color: Colors.grey),
                            ),
                            onTap: () {
                              Navigator.pop(itemContext);
                              if (notif['type'] == 'adoption_request' && notif['cat_id'] != null) {
                                Navigator.push(
                                  this.context,
                                  MaterialPageRoute(
                                    builder: (context) => CatAdoptersListScreen(
                                      catId: int.tryParse(notif['cat_id'].toString()) ?? 0,
                                      catName: notif['pet_name']?.toString() ?? 'น้องแมว',
                                      isAdopted: notif['cat_status'] == 'adopted',
                                      posterId: widget.userId,
                                    ),
                                  ),
                                );
                              } else if (notif['type'] == 'adoption_status') {
                                Navigator.push(
                                  this.context,
                                  MaterialPageRoute(
                                    builder: (context) => AdoptionRequestsScreen(userId: widget.userId),
                                  ),
                                );
                              }
                            },
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
    ).whenComplete(() {
      // Mark as read when closing the bottom sheet
      http.put(Uri.parse(ApiConfig.baseUrl + '/notifications/${widget.userId}/read')).then((_) {
        if (mounted) {
          setState(() {
            _hasNotification = false;
          });
        }
      });
    });
  }

  // Helper เพื่อแปลงวันที่
  String _formatJoinedDate(String? dateStr) {
    if (dateStr == null) return "ไม่ระบุ";
    try {
      final date = DateTime.parse(dateStr);
      final months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
      return "${date.day} ${months[date.month - 1]} ${date.year + 543}";
    } catch (e) {
      return "-";
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFFF5F5), // Pale pink background
      body: SafeArea(
        child: _isLoading
            ? const Center(child: CircularProgressIndicator(color: Colors.pink))
            : RefreshIndicator(
                onRefresh: _fetchData,
                child: SingleChildScrollView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Profile Header
                      Row(
                        children: [
                          GestureDetector(
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (context) => UserProfileScreen(userId: widget.userId, isPosterMode: true),
                                ),
                              );
                            },
                            child: Container(
                              width: 70,
                              height: 70,
                              decoration: BoxDecoration(
                                color: Colors.indigo[200],
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(Icons.person, size: 40, color: Colors.white),
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Text(
                                      _userProfile?['username'] ?? "ไม่ทราบชื่อ",
                                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                                    ),
                                    const SizedBox(width: 4),
                                    const Icon(Icons.verified, color: Colors.blue, size: 16),
                                  ],
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  "ผู้ประกาศหาบ้าน",
                                  style: TextStyle(fontSize: 12, color: Colors.grey[700]),
                                ),
                                Text(
                                  "เข้าร่วมเมื่อ ${_formatJoinedDate(_userProfile?['created_at'])}",
                                  style: TextStyle(fontSize: 12, color: Colors.grey[700]),
                                ),
                              ],
                            ),
                          ),
                          Stack(
                            children: [
                              IconButton(
                                icon: const Icon(Icons.notifications_none, size: 28, color: Colors.black87),
                                onPressed: () {
                                  _showNotificationsBottomSheet();
                                },
                              ),
                              if (_hasNotification)
                                Positioned(
                                  right: 12,
                                  top: 12,
                                  child: Container(
                                    width: 10,
                                    height: 10,
                                    decoration: const BoxDecoration(
                                      color: Colors.redAccent,
                                      shape: BoxShape.circle,
                                    ),
                                  ),
                                ),
                            ],
                          ),
                        ],
                      ),
                      const SizedBox(height: 30),

                      // Title & Big Button
                      const Text(
                        "กำลังมองหาบ้านที่อบอุ่นให้เจ้าเหมียวใช่ไหม?",
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: () async {
                          await Navigator.push(
                            context,
                            MaterialPageRoute(builder: (context) => CatProfileFormScreen(userId: widget.userId)),
                          );
                          _fetchData(); // Refresh list after returning
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFFF8A8A), // Salmon pink
                          padding: const EdgeInsets.symmetric(vertical: 40),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(15),
                          ),
                          elevation: 0,
                        ),
                        child: const Text(
                          "ลงประกาศหาบ้านให้แมว",
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
                        ),
                      ),
                      const SizedBox(height: 30),

                      // Posting History Section
                      const Text(
                        "ประวัติการโพสต์หาบ้าน",
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 10),

                      if (_availableCats.isEmpty && _pendingCats.isEmpty && _adoptedCats.isEmpty)
                        Container(
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFFE4E4),
                            borderRadius: BorderRadius.circular(15),
                          ),
                          child: Column(
                            children: [
                              const Text(
                                "คุณยังไม่มีประกาศหาบ้านเลย\nลองลงประกาศเพื่อช่วยหาบ้านที่อบอุ่นให้เจ้าเหมียวสิ",
                                textAlign: TextAlign.center,
                                style: TextStyle(fontWeight: FontWeight.bold, height: 1.5),
                              ),
                              const SizedBox(height: 20),
                              Container(
                                width: 200,
                                height: 200,
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: const Center(
                                  child: Icon(Icons.inventory_2_outlined, size: 100, color: Colors.orange), // Box/Cat placeholder
                                ),
                              ),
                            ],
                          ),
                        )
                      else
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFFE4E4),
                            borderRadius: BorderRadius.circular(15),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              if (_availableCats.isNotEmpty) ...[
                                _buildCategoryPill("แมวที่กำลังหาบ้าน", Colors.pink[200]!),
                                const SizedBox(height: 10),
                                _buildCatList(_availableCats),
                                const SizedBox(height: 20),
                              ],
                              if (_adoptedCats.isNotEmpty) ...[
                                _buildCategoryPill("แมวที่ได้บ้านที่อบอุ่นแล้ว", Colors.pink[300]!),
                                const SizedBox(height: 10),
                                _buildCatList(_adoptedCats),
                              ]
                            ],
                          ),
                        ),
                    ],
                  ),
                ),
              ),
      ),
    );
  }

  Widget _buildCategoryPill(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(text, style: const TextStyle(fontWeight: FontWeight.bold)),
    );
  }

  Widget _buildCatList(List cats) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 10,
        mainAxisSpacing: 10,
        childAspectRatio: 0.75, // Adjusted for single button
      ),
      itemCount: cats.length,
      itemBuilder: (context, index) {
        final Map<String, dynamic> cat = Map<String, dynamic>.from(cats[index]);
        cat['poster_id'] = widget.userId;
        String catStatus = cat['status'] ?? 'available';
        int activeCount = int.tryParse(cat['active_applications_count']?.toString() ?? '0') ?? 0;
        
        if (catStatus == 'available' && activeCount > 0) {
          catStatus = 'pending';
        }
        
        return GestureDetector(
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => CatDetailScreen(
                  userId: widget.userId,
                  catData: cat,
                ),
              ),
            );
          },
          child: Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(15),
            ),
            padding: const EdgeInsets.all(8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
              // Image
              Expanded(
                child: Container(
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: Colors.grey[200],
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: cat['image_url'] != null
                      ? ClipRRect(
                          borderRadius: BorderRadius.circular(10),
                          child: Image.network(
                            ApiConfig.getImageUrl(cat['image_url']),
                            fit: BoxFit.cover,
                            errorBuilder: (context, error, stackTrace) =>
                                const Icon(Icons.pets, color: Colors.grey, size: 50),
                          ),
                        )
                      : const Icon(Icons.pets, color: Colors.grey),
                ),
              ),
              const SizedBox(height: 8),
              // Details
              Text(cat['pet_name'] ?? 'ไม่ทราบชื่อ', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
              Text("${cat['pet_breed'] ?? ''} • ${ApiConfig.getShortAgeDesc(cat['age_months'])}", style: const TextStyle(fontSize: 10, color: Colors.grey)),
              const SizedBox(height: 4),
              // Tag
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: catStatus == 'available' ? Colors.green : (catStatus == 'pending' ? Colors.orange : const Color(0xFFE55A3F)), // matches screenshot color for adopted
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  catStatus == 'available' ? "ว่าง" : (catStatus == 'pending' ? "มีผู้ขอรับเลี้ยง" : "ได้บ้านแล้ว"),
                  style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                ),
              ),
              const SizedBox(height: 4),
              // Unified Action Button
              GestureDetector(
                onTap: catStatus == 'available' ? null : () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => CatAdoptersListScreen(
                        catId: int.tryParse(cat['cat_id'].toString()) ?? 0, 
                        catName: cat['pet_name'].toString(),
                        isAdopted: catStatus == 'adopted',
                        posterId: widget.userId,
                      ),
                    ),
                  );
                },
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1B3B5A),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        catStatus == 'available' ? "ยังไม่มีคำขอรับเลี้ยง" : "รายละเอียดผู้รับเลี้ยง", 
                        style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)
                      ),
                      const Icon(Icons.play_arrow, color: Colors.white, size: 14),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ));
      },
    );
  }
}
