import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'poster_dashboard_screen.dart';
import 'cat_detail_screen.dart';
import 'adopter_profile_screen.dart';

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
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    fetchCats();
  }

  Future<void> fetchCats() async {
    // เปลี่ยน URL ให้ใช้พอร์ต 3000 ตามที่เซ็ตไว้บน Backend
    final url = Uri.parse('http://10.0.2.2:3000/api/cats'); 

    try {
      final response = await http.get(url);
      if (response.statusCode == 200) {
        final Map<String, dynamic> responseData = json.decode(response.body);
        setState(() {
          // ดึงข้อมูลจาก responseData['data'] เพราะ API ส่ง { success: true, count: X, data: [...] }
          cats = responseData['data'] ?? [];
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

  Future<void> _onCatCardTapped(Map<String, dynamic> cat) async {
    // Show loading indicator
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(child: CircularProgressIndicator(color: Colors.pink)),
    );

    try {
      final response = await http.get(Uri.parse('http://10.0.2.2:3000/api/adopters/user/${widget.userId}'));
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
                      catId: cat['cat_id'], 
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
                    width: 50,
                    height: 50,
                    decoration: BoxDecoration(
                      color: Colors.brown[300],
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.person, color: Colors.white, size: 30),
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
                  decoration: InputDecoration(
                    hintText: "ค้นหาเจ้าเหมียว",
                    hintStyle: TextStyle(color: Colors.grey[400]),
                    prefixIcon: const Icon(Icons.search, color: Colors.black54),
                    suffixIcon: const Icon(Icons.tune, color: Colors.black54),
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 15),
                  ),
                ),
              ),
            ),
            
            const SizedBox(height: 20),

            // Tag "เหมียวหาบ้าน"
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Align(
                alignment: Alignment.centerLeft,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: Colors.pink[200],
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Text(
                    "เหมียวหาบ้าน",
                    style: TextStyle(fontWeight: FontWeight.bold, color: Colors.black87),
                  ),
                ),
              ),
            ),
            
            const SizedBox(height: 10),

            // Cat Grid List
            Expanded(
              child: isLoading
                  ? Center(child: CircularProgressIndicator(color: Colors.pink[300]))
                  : cats.isEmpty
                      ? const Center(child: Text('ยังไม่มีข้อมูลน้องแมวหาบ้านในขณะนี้'))
                      : GridView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 2,
                            crossAxisSpacing: 16,
                            mainAxisSpacing: 16,
                            childAspectRatio: 0.75, // Adjust based on image vs text height
                          ),
                          itemCount: cats.length,
                          itemBuilder: (context, index) {
                            final cat = cats[index];
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