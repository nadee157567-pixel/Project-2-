import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'cat_detail_screen.dart';
import 'user_profile_screen.dart';
import 'poster_dashboard_screen.dart';
import 'adopter_profile_screen.dart';
import 'chat_list_screen.dart';
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
  bool isLoadingRecommended = false;

  Future<void> fetchRecommendedCats() async {
    setState(() { isLoadingRecommended = true; });
    try {
      // 1. ดึงโปรไฟล์
      final profileRes = await http.get(Uri.parse(ApiConfig.baseUrl + '/adopters/profile/${widget.userId}'));
      if (profileRes.statusCode != 200) {
        setState(() { isLoadingRecommended = false; });
        return;
      }
      final profileData = json.decode(profileRes.body)['profile'];
      if (profileData == null) {
        setState(() { isLoadingRecommended = false; });
        return;
      }

      // 2. จัดรูปแบบข้อมูลให้เข้ากับ matchAllCats
      String freeHoursStr = profileData['daily_free_hours']?.toString() ?? 'medium';
      String attentionLevel = freeHoursStr; // 'low', 'medium', 'high' matches attention_level format

      String budgetStr = profileData['max_monthly_budget']?.toString() ?? 'medium';

      final reqBody = {
        "housing_type": profileData['living_space_type'] ?? 'house',
        "space_level": profileData['space_size'] ?? 'medium',
        "budget_level": budgetStr, // Used budget_level instead of monthly_budget
        "attention_level": attentionLevel,
        "experience_level": profileData['experience'] ?? 'none',
        "pets_allowed": true,
        "has_children": (profileData['has_children'] == 1),
        "has_cats": (profileData['has_other_pets'] == 1),
        "has_dogs": false,
        "has_severe_allergy": false,
        "accepts_special_needs": false,
        "applicant_id": widget.userId
      };

      // 3. เรียก API matching
      final matchRes = await http.post(
        Uri.parse(ApiConfig.baseUrl + '/matching/'),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode(reqBody)
      );

      if (matchRes.statusCode == 200) {
        final matchData = json.decode(matchRes.body);
        setState(() {
          recommendedCats = matchData['data'] ?? [];
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
          );
          return;
        }
      }
      
      // ไม่มีโปรไฟล์ ขึ้นแจ้งเตือน
      showDialog(
        context: context,
        builder: (context) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: const Text("ขอข้อมูลเพิ่มเติม", style: TextStyle(fontWeight: FontWeight.bold)),
          content: const Text(
              "เนื่องจากเป็นการใช้งานครั้งแรก ระบบขอให้คุณกรอกข้อมูลเพื่อนำไปประเมินความเหมาะสมในการรับเลี้ยงแมว\n\n* ข้อมูลนี้ทำเพียงครั้งแรกและสามารถแก้ไขได้ภายหลัง\n* กรุณากรอกข้อมูลตามความเป็นจริง",
              style: TextStyle(height: 1.5)),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text("ยกเลิก", style: TextStyle(color: Colors.grey)),
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
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.pink[400],
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              ),
              child: const Text("กรอกข้อมูล", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
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
  }

  Widget _buildAdopterView() {
    return Scaffold(
      backgroundColor: const Color(0xFFFFF5F5), // Pale pink background
      body: SafeArea(
        child: Column(
          children: [
            // Header: Profile & Greeting
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 10),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          "วันนี้คุณสนใจรับน้องแมวไปเลี้ยงสักตัวไหมครับ",
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: Colors.black87,
                            height: 1.4,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 16),
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.05),
                          blurRadius: 5,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: IconButton(
                      icon: Icon(Icons.chat_bubble_outline, color: Colors.pink[300]),
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => ChatListScreen(userId: widget.userId),
                          ),
                        );
                      },
                    ),
                  ),
                  const SizedBox(width: 12),
                  GestureDetector(
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => UserProfileScreen(userId: widget.userId),
                        ),
                      );
                    },
                    child: Container(
                      width: 50,
                      height: 50,
                      decoration: BoxDecoration(
                        color: Colors.brown[300],
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.person, color: Colors.white, size: 30),
                    ),
                  )
                ],
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
                    hintText: "ค้นหาเจ้าเหมียว",
                    hintStyle: TextStyle(color: Colors.grey[400]),
                    prefixIcon: const Icon(Icons.search, color: Colors.black54),
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
            
            const SizedBox(height: 20),

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
                  : (_showRecommended ? recommendedCats : filteredCats).isEmpty
                      ? const Center(child: Text('ยังไม่มีข้อมูลน้องแมวที่ตรงกับเงื่อนไข'))
                      : GridView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 2,
                            crossAxisSpacing: 16,
                            mainAxisSpacing: 16,
                            childAspectRatio: 0.75, // Adjust based on image vs text height
                          ),
                          itemCount: (_showRecommended ? recommendedCats : filteredCats).length,
                          itemBuilder: (context, index) {
                            final cat = (_showRecommended ? recommendedCats : filteredCats)[index];
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
                                                      cat['image_url'],
                                                      fit: BoxFit.cover,
                                                      errorBuilder: (context, error, stackTrace) =>
                                                          const Icon(Icons.pets, color: Colors.grey, size: 40),
                                                    ),
                                                  )
                                                : const Icon(Icons.pets, color: Colors.grey, size: 40),
                                          ),
                                          // Favorite Icon
                                          Positioned(
                                            top: 8,
                                            right: 8,
                                            child: Container(
                                              padding: const EdgeInsets.all(4),
                                              decoration: const BoxDecoration(
                                                color: Colors.white,
                                                shape: BoxShape.circle,
                                              ),
                                              child: const Icon(Icons.favorite_border, size: 16, color: Colors.redAccent),
                                            ),
                                          )
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
                                            "${cat['pet_breed'] ?? 'ไม่ระบุ'} อายุ ${cat['age_months']} เดือน",
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
      body: _selectedIndex == 0 ? _buildAdopterView() : _buildPosterView(),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _selectedIndex,
        onTap: _onItemTapped,
        selectedItemColor: Colors.pink[400],
        unselectedItemColor: Colors.grey,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home),
            label: 'ผู้รับเลี้ยง',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.add_circle_outline),
            label: 'ผู้โพสต์หาบ้าน',
          ),
        ],
      ),
    );
  }
}