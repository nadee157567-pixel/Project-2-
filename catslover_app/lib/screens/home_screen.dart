import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'cat_detail_screen.dart';
import 'user_profile_screen.dart';
import 'poster_dashboard_screen.dart';
import 'adopter_profile_screen.dart';
import 'chat_list_screen.dart';
import 'adoption_requests_screen.dart';
import 'cat_adopters_list_screen.dart';
import '../config/api_config.dart';

class HomeScreen extends StatefulWidget {
  final int userId;
  const HomeScreen({super.key, required this.userId});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _selectedIndex = 0;

  // สำหรับหน้า Feed
  List cats = [];
  List filteredCats = [];
  bool isLoading = true;
  String? username;
  Map<String, dynamic>? userInfo;

  int unreadChatCount = 0;
  bool hasAdopterNotification = false;
  String _formatDate(String? isoDate) {
    if (isoDate == null) return "ไม่ระบุ";
    try {
      final date = DateTime.parse(isoDate);
      final List<String> thaiMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
      final month = thaiMonths[date.month - 1];
      final year = date.year + 543;
      return "${date.day} $month $year";
    } catch (e) {
      return "-";
    }
  }

  // State สำหรับ Filter
  String searchQuery = "";
  List<String> selectedBreeds = [];
  List<String> selectedAgeRanges = [];

  final List<String> allBreeds = [
    'วิเชียรมาศ',
    'ขาวมณี',
    'เปอร์เซีย',
    'สีสวาด',
    'สก็อตติช โฟลด์',
    'อเมริกัน ช็อตแฮร์',
    'ศุภลักษณ์',
    'แมวไทย',
    'ไม่ทราบสายพันธุ์'
  ];

  final List<String> allAgeRanges = [
    'ต่ำกว่า 2 เดือน (ยังไม่หย่านม)',
    '2 - 6 เดือน (ลูกแมว)',
    'มากกว่า 6 เดือน - 1 ปี (แมววัยรุ่น)',
    'มากกว่า 1 ปี - 7 ปี (แมวโตเต็มวัย)',
    'มากกว่า 7 ปี (แมวสูงวัย)'
  ];

  @override
  void initState() {
    super.initState();
    fetchCats();
    fetchUserInfo();
    _fetchNotifications();
  }

  Future<void> _fetchNotifications() async {
    try {
      final response = await http.get(Uri.parse(ApiConfig.baseUrl + '/notifications/unread-counts/${widget.userId}'));
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success'] == true) {
          if (!mounted) return;
          setState(() {
            unreadChatCount = data['unreadChats'] ?? 0;
            hasAdopterNotification = (data['unreadNotifications'] ?? 0) > 0;
          });
        }
      }
    } catch (e) {
      print('Error fetching notifications: $e');
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
                              _formatDate(notif['created_at']),
                              style: const TextStyle(fontSize: 12, color: Colors.grey),
                            ),
                            onTap: () {
                              Navigator.pop(itemContext); // ปิดหน้าต่าง
                              if (notif['type'] == 'adoption_status') {
                                Navigator.push(
                                  this.context,
                                  MaterialPageRoute(
                                    builder: (context) => AdoptionRequestsScreen(userId: widget.userId),
                                  ),
                                );
                              } else if (notif['type'] == 'adoption_request' && notif['cat_id'] != null) {
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
            hasAdopterNotification = false;
          });
        }
      });
    });
  }

  Future<void> fetchUserInfo() async {
    try {
      final response = await http.get(Uri.parse(ApiConfig.baseUrl + '/auth/user/${widget.userId}'));
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success'] == true && data['data'] != null) {
          if (!mounted) return;
          setState(() {
            userInfo = data['data'];
            username = data['data']['username'] ?? data['data']['fullname'];
          });
        }
      }
    } catch (e) {
      print('Error fetching user info in HomeScreen: $e');
    }
  }

  List<int> _requestedCatIds = [];

  Future<void> fetchCats() async {
    // เปลี่ยน URL ให้ใช้พอร์ต 3000 ตามที่เซ็ตไว้บน Backend
    final url = Uri.parse(ApiConfig.baseUrl + '/cats'); 

    final reqUrl = Uri.parse(ApiConfig.baseUrl + '/adoption/adopter/${widget.userId}');
    try {
      final response = await http.get(url);
      final reqResponse = await http.get(reqUrl);
      
      if (reqResponse.statusCode == 200) {
        final reqData = json.decode(reqResponse.body);
        if (reqData['success'] == true && reqData['data'] != null) {
          final List requests = reqData['data'];
          _requestedCatIds = requests.map<int>((r) => r['cat_id'] as int).toList();
        }
      }

      if (response.statusCode == 200) {
        final Map<String, dynamic> responseData = json.decode(response.body);
        if (!mounted) return;
        setState(() {
          // ดึงข้อมูลจาก responseData['data'] เพราะ API ส่ง { success: true, count: X, data: [...] }
          cats = responseData['data'] ?? [];
          _applyFilters();
          isLoading = false;
        });
      } else {
        setState(() { isLoading = false; });
        print('ดึงข้อมูลไม่ได้: ${response.statusCode}');
      }
    } catch (error) {
      setState(() { isLoading = false; });
      print('เกิดข้อผิดพลาด: $error');
    }
  }

  bool _showRecommended = false;
  List<dynamic> recommendedCats = [];
  List<dynamic> filteredRecommendedCats = [];
  bool isLoadingRecommended = false;

  Future<void> fetchRecommendedCats() async {
    setState(() { isLoadingRecommended = true; });
    try {
      // 1. เรียก API matching โดยส่งแค่ userId
      // Backend จะดึงโปรไฟล์จากฐานข้อมูลและประเมินให้โดยอัตโนมัติ
      final matchRes = await http.post(
        Uri.parse(ApiConfig.baseUrl + '/matching/'),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({"userId": widget.userId})
      );

      if (matchRes.statusCode == 200) {
        final matchData = json.decode(matchRes.body);
        if (!mounted) return;
        setState(() {
          List<dynamic> recs = matchData['data'] ?? [];
          recs.sort((a, b) => (b['match_percentage'] as num).compareTo(a['match_percentage'] as num));
          recs = recs.where((cat) {
            if ((cat['match_percentage'] as num) < 80) return false;
            if (cat['eligible'] == false) return false;
            if (cat['poster_id'] == widget.userId) return false;
            if (_requestedCatIds.contains(cat['cat_id'])) return false;
            if (cat['status'] == 'adopted') return false;
            return true;
          }).toList();
          recommendedCats = recs;
          _applyFilters();
          isLoadingRecommended = false;
        });
      } else {
        setState(() { isLoadingRecommended = false; });
      }
    } catch (e) {
      print("Error recommended: $e");
      setState(() { isLoadingRecommended = false; });
    }
  }
  void _applyFilters() {
    setState(() {
      filteredCats = cats.where((cat) {
        // ห้ามเห็นแมวที่ตัวเองโพสต์
        if (cat['poster_id'] == widget.userId) return false;
        
        // ห้ามเห็นแมวที่เคยขอรับเลี้ยงไปแล้ว
        if (_requestedCatIds.contains(cat['cat_id'])) return false;
        
        // ห้ามเห็นแมวที่ถูกรับเลี้ยงไปแล้ว
        if (cat['status'] == 'adopted') return false;

        // Search Query
        bool matchesSearch = true;
        if (searchQuery.isNotEmpty) {
          final query = searchQuery.toLowerCase().trim();
          final name = (cat['pet_name'] ?? '').toString().toLowerCase();
          final breed = (cat['pet_breed'] ?? '').toString().toLowerCase();
          matchesSearch = name.contains(query) || breed.contains(query);
        }

        // Breed Filter
        bool matchesBreed = true;
        if (selectedBreeds.isNotEmpty) {
          final breed = (cat['pet_breed'] ?? 'ไม่ทราบสายพันธุ์').toString().trim().toLowerCase();
          matchesBreed = selectedBreeds.any((selected) {
            final sel = selected.toLowerCase().replaceAll('แมว', '').trim();
            return breed.contains(sel) || sel.contains(breed);
          });
        }

        // Age Filter
        bool matchesAge = true;
        if (selectedAgeRanges.isNotEmpty) {
          final rawAge = cat['age_months'];
          double ageMonths = 0;
          if (rawAge is num) {
            ageMonths = rawAge.toDouble();
          } else if (rawAge != null) {
            ageMonths = double.tryParse(rawAge.toString()) ?? 0;
          }

          matchesAge = false;
          if (selectedAgeRanges.contains('ต่ำกว่า 2 เดือน (ยังไม่หย่านม)') && ageMonths < 2) matchesAge = true;
          if (selectedAgeRanges.contains('2 - 6 เดือน (ลูกแมว)') && ageMonths >= 2 && ageMonths <= 6) matchesAge = true;
          if (selectedAgeRanges.contains('มากกว่า 6 เดือน - 1 ปี (แมววัยรุ่น)') && ageMonths > 6 && ageMonths <= 12) matchesAge = true;
          if (selectedAgeRanges.contains('มากกว่า 1 ปี - 7 ปี (แมวโตเต็มวัย)') && ageMonths > 12 && ageMonths <= 84) matchesAge = true;
          if (selectedAgeRanges.contains('มากกว่า 7 ปี (แมวสูงวัย)') && ageMonths > 84) matchesAge = true;
        }

        return matchesSearch && matchesBreed && matchesAge;
      }).toList();

      if (recommendedCats.isNotEmpty) {
        filteredRecommendedCats = recommendedCats.where((cat) {
          if (_requestedCatIds.contains(cat['cat_id'])) return false;
          
          // Search Query
          bool matchesSearch = true;
          if (searchQuery.isNotEmpty) {
            final query = searchQuery.toLowerCase().trim();
            final name = (cat['pet_name'] ?? '').toString().toLowerCase();
            final breed = (cat['pet_breed'] ?? '').toString().toLowerCase();
            matchesSearch = name.contains(query) || breed.contains(query);
          }

          // Breed Filter
          bool matchesBreed = true;
          if (selectedBreeds.isNotEmpty) {
            final breed = (cat['pet_breed'] ?? 'ไม่ทราบสายพันธุ์').toString().trim().toLowerCase();
            matchesBreed = selectedBreeds.any((selected) {
              final sel = selected.toLowerCase().replaceAll('แมว', '').trim();
              return breed.contains(sel) || sel.contains(breed);
            });
          }

          // Age Filter
          bool matchesAge = true;
          if (selectedAgeRanges.isNotEmpty) {
            final rawAge = cat['age_months'];
            double ageMonths = 0;
            if (rawAge is num) {
              ageMonths = rawAge.toDouble();
            } else if (rawAge != null) {
              ageMonths = double.tryParse(rawAge.toString()) ?? 0;
            }

            matchesAge = false;
            if (selectedAgeRanges.contains('ต่ำกว่า 2 เดือน (ยังไม่หย่านม)') && ageMonths < 2) matchesAge = true;
            if (selectedAgeRanges.contains('2 - 6 เดือน (ลูกแมว)') && ageMonths >= 2 && ageMonths <= 6) matchesAge = true;
            if (selectedAgeRanges.contains('มากกว่า 6 เดือน - 1 ปี (แมววัยรุ่น)') && ageMonths > 6 && ageMonths <= 12) matchesAge = true;
            if (selectedAgeRanges.contains('มากกว่า 1 ปี - 7 ปี (แมวโตเต็มวัย)') && ageMonths > 12 && ageMonths <= 84) matchesAge = true;
            if (selectedAgeRanges.contains('มากกว่า 7 ปี (แมวสูงวัย)') && ageMonths > 84) matchesAge = true;
          }

          return matchesSearch && matchesBreed && matchesAge;
        }).toList();
      } else {
        filteredRecommendedCats = [];
      }
    });
  }

  void _showFilterDialog() {
    showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setStateDialog) {
            return Dialog(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              backgroundColor: Colors.white,
              child: Stack(
                children: [
                  Container(
                    width: MediaQuery.of(context).size.width * 0.9,
                    padding: const EdgeInsets.fromLTRB(24, 36, 24, 24),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Left Column: Breeds
                            Expanded(
                              flex: 4,
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.center,
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                    decoration: BoxDecoration(
                                      border: Border.all(color: Colors.red[200]!),
                                      borderRadius: BorderRadius.circular(10),
                                      color: Colors.red[50],
                                    ),
                                    child: const Text("ค้นหาตามสายพันธุ์", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                                  ),
                                  const SizedBox(height: 12),
                                  ...allBreeds.map((breed) {
                                    return InkWell(
                                      onTap: () {
                                        setStateDialog(() {
                                          if (selectedBreeds.contains(breed)) {
                                            selectedBreeds.remove(breed);
                                          } else {
                                            selectedBreeds.add(breed);
                                          }
                                        });
                                      },
                                      child: Padding(
                                        padding: const EdgeInsets.symmetric(vertical: 6.0),
                                        child: Row(
                                          children: [
                                            Icon(
                                              selectedBreeds.contains(breed) ? Icons.check_box : Icons.check_box_outline_blank,
                                              size: 20,
                                              color: selectedBreeds.contains(breed) ? Colors.black87 : Colors.black54,
                                            ),
                                            const SizedBox(width: 8),
                                            Expanded(child: Text(breed, style: const TextStyle(fontSize: 13))),
                                          ],
                                        ),
                                      ),
                                    );
                                  }),
                                ],
                              ),
                            ),
                            const SizedBox(width: 12),
                            // Right Column: Age Ranges
                            Expanded(
                              flex: 3,
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.center,
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                    decoration: BoxDecoration(
                                      border: Border.all(color: Colors.red[200]!),
                                      borderRadius: BorderRadius.circular(10),
                                      color: Colors.red[50],
                                    ),
                                    child: const Text("ช่วงอายุ", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                                  ),
                                  const SizedBox(height: 12),
                                  ...allAgeRanges.map((age) {
                                    return InkWell(
                                      onTap: () {
                                        setStateDialog(() {
                                          if (selectedAgeRanges.contains(age)) {
                                            selectedAgeRanges.remove(age);
                                          } else {
                                            selectedAgeRanges.add(age);
                                          }
                                        });
                                      },
                                      child: Padding(
                                        padding: const EdgeInsets.symmetric(vertical: 6.0),
                                        child: Row(
                                          children: [
                                            Icon(
                                              selectedAgeRanges.contains(age) ? Icons.check_box : Icons.check_box_outline_blank,
                                              size: 20,
                                              color: selectedAgeRanges.contains(age) ? Colors.black87 : Colors.black54,
                                            ),
                                            const SizedBox(width: 8),
                                            Expanded(child: Text(age, style: const TextStyle(fontSize: 13))),
                                          ],
                                        ),
                                      ),
                                    );
                                  }),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 24),
                        // Buttons
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                          children: [
                            TextButton(
                              onPressed: () {
                                _applyFilters();
                                Navigator.pop(context);
                              },
                              child: const Text(
                                "ดูผลลัพธ์",
                                style: TextStyle(
                                  color: Colors.black,
                                  fontWeight: FontWeight.bold,
                                  decoration: TextDecoration.underline,
                                  fontSize: 16,
                                ),
                              ),
                            ),
                            TextButton(
                              onPressed: () {
                                setStateDialog(() {
                                  selectedBreeds.clear();
                                  selectedAgeRanges.clear();
                                });
                                _applyFilters();
                              },
                              child: const Text(
                                "ล้างค่า",
                                style: TextStyle(
                                  color: Colors.black,
                                  fontWeight: FontWeight.bold,
                                  decoration: TextDecoration.underline,
                                  fontSize: 16,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  Positioned(
                    top: 6,
                    right: 6,
                    child: IconButton(
                      icon: const Icon(Icons.close, color: Colors.black54),
                      onPressed: () => Navigator.pop(context),
                      tooltip: 'ปิด',
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

  Future<void> _onCatCardTapped(Map<String, dynamic> cat) async {
    // Show loading indicator
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(child: CircularProgressIndicator(color: Colors.pink)),
    );

    try {
      final response = await http.get(Uri.parse(ApiConfig.baseUrl + '/adopters/user/${widget.userId}'));
      if (!mounted) return;
      Navigator.pop(context); // Close loading

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['exists'] == true) {
          // มีโปรไฟล์แล้ว ไปหน้า CatDetail
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => CatDetailScreen(
                userId: widget.userId,
                catData: cat,
              ),
            ),
          ).then((_) {
            _fetchNotifications();
          });
          return;
        }
      }
      
      // ไม่มีโปรไฟล์ ขึ้นแจ้งเตือน
      showDialog(
        context: context,
        builder: (context) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: const Text("ยินดีต้อนรับว่าที่ทาสแมว!", style: TextStyle(fontWeight: FontWeight.bold)),
          content: const Text(
              "เนื่องจากเป็นการเจอกันครั้งแรก เราขอให้คุณสร้างโปรไฟล์เล็กน้อยเพื่อนำไปจับคู่กับน้องแมวที่เหมาะกับไลฟ์สไตล์ของคุณที่สุด\n\n* ทำเพียงครั้งแรกและสามารถแก้ไขทีหลังได้\n* ข้อมูลของคุณจะช่วยให้น้องแมวได้บ้านที่ใช่!",
              style: TextStyle(height: 1.5)),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text("ไว้ทีหลัง", style: TextStyle(color: Colors.grey)),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.pop(context); // ปิด Dialog
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => AdopterProfileScreen(
                      userId: widget.userId,
                      catId: int.tryParse(cat['cat_id'].toString()) ?? 0, 
                    ),
                  ),
                ).then((_) {
                  fetchRecommendedCats();
                  _fetchNotifications();
                });
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.pink[400],
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              ),
              child: const Text("สร้างโปรไฟล์ทาสแมว", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      );
    } catch (e) {
      if (!mounted) return;
      Navigator.pop(context); // Close loading
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("เกิดข้อผิดพลาดในการเชื่อมต่อ")));
    }
  }

  void _onItemTapped(int index) {
    setState(() {
      _selectedIndex = index;
    });
    // รีเฟรชตัวเลขแจ้งเตือนทุกครั้งที่เปลี่ยนแท็บ
    _fetchNotifications();
  }

  Widget _buildAdopterView() {
    return Scaffold(
      backgroundColor: const Color(0xFFFFF5F5), // Pale pink background
      body: SafeArea(
        child: Column(
          children: [
            // Header: Profile Card style
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 10),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  GestureDetector(
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => UserProfileScreen(userId: widget.userId),
                        ),
                      ).then((_) {
                        fetchRecommendedCats();
                        _fetchNotifications();
                      });
                    },
                    child: Container(
                      width: 60,
                      height: 60,
                      decoration: BoxDecoration(
                        color: Colors.indigo[200],
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.person, size: 36, color: Colors.white),
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
                              username ?? 'กำลังโหลด...',
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: Colors.black87,
                              ),
                            ),
                            const SizedBox(width: 6),
                            const Icon(Icons.verified, color: Colors.blue, size: 16),
                          ],
                        ),
                        const SizedBox(height: 2),
                        Text(
                          userInfo?['role'] == 'admin' ? 'ผู้ดูแลระบบ' : 'ผู้ขอรับเลี้ยง',
                          style: TextStyle(
                            fontSize: 13,
                            color: Colors.grey[600],
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          "เข้าร่วมเมื่อ ${_formatDate(userInfo?['created_at'])}",
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey[500],
                          ),
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
                      if (hasAdopterNotification)
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
            ),
            const Padding(
              padding: EdgeInsets.fromLTRB(20, 10, 20, 15),
              child: Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  "กำลังมองหาเพื่อนเหมียวที่น่ารักอยู่ใช่ไหม",
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Colors.black87,
                  ),
                ),
              ),
            ),

            // Search Bar
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(25),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.05),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: TextField(
                  onChanged: (value) {
                    searchQuery = value;
                    _applyFilters();
                  },
                  decoration: InputDecoration(
                    hintText: (selectedBreeds.isEmpty && selectedAgeRanges.isEmpty) ? "ค้นหาเจ้าเหมียว" : "",
                    hintStyle: TextStyle(color: Colors.grey[400]),
                    prefixIcon: const Icon(Icons.search, color: Colors.black54),
                    prefix: (selectedBreeds.isNotEmpty || selectedAgeRanges.isNotEmpty)
                        ? ConstrainedBox(
                            constraints: BoxConstraints(
                              maxWidth: MediaQuery.of(context).size.width * 0.55,
                            ),
                            child: SingleChildScrollView(
                              scrollDirection: Axis.horizontal,
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  ...selectedBreeds.map((breed) => Padding(
                                    padding: const EdgeInsets.only(right: 6),
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                      decoration: BoxDecoration(
                                        color: Colors.pink[50],
                                        borderRadius: BorderRadius.circular(20),
                                        border: Border.all(color: Colors.pink[200]!, width: 0.5),
                                      ),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Text(breed, style: TextStyle(fontSize: 12, color: Colors.pink[700], fontWeight: FontWeight.w500)),
                                          const SizedBox(width: 4),
                                          GestureDetector(
                                            onTap: () {
                                              setState(() {
                                                selectedBreeds.remove(breed);
                                                _applyFilters();
                                              });
                                            },
                                            child: Icon(Icons.close, size: 14, color: Colors.pink[700]),
                                          ),
                                        ],
                                      ),
                                    ),
                                  )),
                                  ...selectedAgeRanges.map((age) => Padding(
                                    padding: const EdgeInsets.only(right: 6),
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                      decoration: BoxDecoration(
                                        color: Colors.pink[50],
                                        borderRadius: BorderRadius.circular(20),
                                        border: Border.all(color: Colors.pink[200]!, width: 0.5),
                                      ),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Text(age, style: TextStyle(fontSize: 12, color: Colors.pink[700], fontWeight: FontWeight.w500)),
                                          const SizedBox(width: 4),
                                          GestureDetector(
                                            onTap: () {
                                              setState(() {
                                                selectedAgeRanges.remove(age);
                                                _applyFilters();
                                              });
                                            },
                                            child: Icon(Icons.close, size: 14, color: Colors.pink[700]),
                                          ),
                                        ],
                                      ),
                                    ),
                                  )),
                                ],
                              ),
                            ),
                          )
                        : null,
                    suffixIcon: IconButton(
                      icon: const Icon(Icons.tune, color: Colors.black54),
                      onPressed: _showFilterDialog,
                    ),
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 15),
                  ),
                ),
              ),
            ),
            
            const SizedBox(height: 12),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Row(
                children: [
                  GestureDetector(
                    onTap: () {
                      setState(() { _showRecommended = false; });
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      decoration: BoxDecoration(
                        color: !_showRecommended ? Colors.pink[200] : Colors.grey[200],
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        "เหมียวหาบ้าน",
                        style: TextStyle(
                          fontWeight: FontWeight.bold, 
                          color: !_showRecommended ? Colors.black87 : Colors.grey[600]
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  GestureDetector(
                    onTap: () {
                      setState(() { _showRecommended = true; });
                      if (recommendedCats.isEmpty) {
                        fetchRecommendedCats();
                      }
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      decoration: BoxDecoration(
                        color: _showRecommended ? Colors.pink[200] : Colors.grey[200],
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        "แมวที่เหมาะกับคุณ",
                        style: TextStyle(
                          fontWeight: FontWeight.bold, 
                          color: _showRecommended ? Colors.black87 : Colors.grey[600]
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: 10),

            // Cat Grid List
            Expanded(
              child: (_showRecommended ? isLoadingRecommended : isLoading)
                  ? Center(child: CircularProgressIndicator(color: Colors.pink[300]))
                  : (_showRecommended ? filteredRecommendedCats : filteredCats).isEmpty
                      ? const Center(child: Text('ยังไม่มีข้อมูลน้องแมวที่ตรงกับเงื่อนไข'))
                      : GridView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 2,
                            crossAxisSpacing: 16,
                            mainAxisSpacing: 16,
                            childAspectRatio: 0.75, // Adjust based on image vs text height
                          ),
                          itemCount: (_showRecommended ? filteredRecommendedCats : filteredCats).length,
                          itemBuilder: (context, index) {
                            final cat = (_showRecommended ? filteredRecommendedCats : filteredCats)[index];
                            return GestureDetector(
                              onTap: () => _onCatCardTapped(cat),
                              child: Container(
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(20),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black.withOpacity(0.03),
                                      blurRadius: 8,
                                      offset: const Offset(0, 4),
                                    ),
                                  ],
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    // Image
                                    Expanded(
                                      child: Stack(
                                        children: [
                                          Container(
                                            width: double.infinity,
                                            decoration: BoxDecoration(
                                              borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
                                              color: Colors.grey[200],
                                            ),
                                            child: cat['image_url'] != null
                                                ? ClipRRect(
                                                    borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
                                                    child: Image.network(
                                                      ApiConfig.getImageUrl(cat['image_url']),
                                                      fit: BoxFit.cover,
                                                      errorBuilder: (context, error, stackTrace) =>
                                                          const Icon(Icons.pets, color: Colors.grey, size: 40),
                                                    ),
                                                  )
                                                : const Icon(Icons.pets, color: Colors.grey, size: 40),
                                          ),

                                        ],
                                      ),
                                    ),
                                    // Details
                                    Padding(
                                      padding: const EdgeInsets.all(12),
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            cat['pet_name'] ?? 'ไม่ระบุชื่อ',
                                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                          const SizedBox(height: 4),
                                          Text(
                                            "${cat['pet_breed'] ?? 'ไม่ระบุ'} • ${ApiConfig.getShortAgeDesc(cat['age_months'])}",
                                            style: TextStyle(fontSize: 11, color: Colors.grey[600]),
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPosterView() {
    return PosterDashboardScreen(userId: widget.userId);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _selectedIndex == 0
          ? _buildAdopterView()
          : _selectedIndex == 1
              ? ChatListScreen(userId: widget.userId, onRefreshUnread: _fetchNotifications)
              : _buildPosterView(),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _selectedIndex,
        onTap: _onItemTapped,
        selectedItemColor: Colors.pink[400],
        unselectedItemColor: Colors.grey,
        type: BottomNavigationBarType.fixed,
        items: [
          const BottomNavigationBarItem(
            icon: Icon(Icons.home),
            label: 'ผู้รับเลี้ยง',
          ),
          BottomNavigationBarItem(
            icon: Stack(
              clipBehavior: Clip.none,
              children: [
                const Icon(Icons.chat_bubble),
                if (unreadChatCount > 0)
                  Positioned(
                    right: -4,
                    top: -4,
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: const BoxDecoration(
                        color: Colors.redAccent,
                        shape: BoxShape.circle,
                      ),
                      child: Text(
                        unreadChatCount > 9 ? '9+' : unreadChatCount.toString(),
                        style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ),
              ],
            ),
            label: 'แชท',
          ),
          const BottomNavigationBarItem(
            icon: Icon(Icons.add_circle_outline),
            label: 'ผู้โพสต์หาบ้าน',
          ),
        ],
      ),
    );
  }
}