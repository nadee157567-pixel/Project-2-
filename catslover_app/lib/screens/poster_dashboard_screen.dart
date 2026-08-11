import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'cat_profile_form_screen.dart';
import 'cat_detail_screen.dart';
import 'user_profile_screen.dart';
import 'cat_adopters_list_screen.dart';
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
          _availableCats = cats.where((c) => c['status'] == 'available').toList();
          _pendingCats = cats.where((c) => c['status'] == 'pending').toList();
          _adoptedCats = cats.where((c) => c['status'] == 'adopted').toList();
        }
      }
    } catch (e) {
      print("Error fetching dashboard data: $e");
    } finally {
      if (!mounted) return;
      if (mounted) setState(() => _isLoading = false);
    }
  }

  // Helper เพื่อแปลงวันที่
  String _formatJoinedDate(String? dateStr) {
    if (dateStr == null) return "ไม่ระบุ";
    try {
      final date = DateTime.parse(dateStr);
      final months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
      return "${months[date.month - 1]} ${date.year + 543}";
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
                                _buildCatList(_availableCats, 'available'),
                                const SizedBox(height: 20),
                              ],
                              if (_pendingCats.isNotEmpty) ...[
                                _buildCategoryPill("แมวที่มีผู้ขอรับเลี้ยง", Colors.orange[300]!),
                                const SizedBox(height: 10),
                                _buildCatList(_pendingCats, 'pending'),
                                const SizedBox(height: 20),
                              ],
                              if (_adoptedCats.isNotEmpty) ...[
                                _buildCategoryPill("แมวที่ได้บ้านที่อบอุ่นแล้ว", Colors.pink[300]!),
                                const SizedBox(height: 10),
                                _buildCatList(_adoptedCats, 'adopted'),
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

  Widget _buildCatList(List cats, String listStatus) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 10,
        mainAxisSpacing: 10,
        childAspectRatio: 0.6, // Adjusted for second button
      ),
      itemCount: cats.length,
      itemBuilder: (context, index) {
        // Create a modifiable copy of the cat data and ensure poster_id is set
        final Map<String, dynamic> cat = Map<String, dynamic>.from(cats[index]);
        cat['poster_id'] = widget.userId;
        
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
                  color: listStatus == 'available' ? Colors.green : (listStatus == 'pending' ? Colors.orange : Colors.grey),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  listStatus == 'available' ? "ว่าง" : (listStatus == 'pending' ? "มีผู้ขอรับเลี้ยง" : "ได้บ้านแล้ว"),
                  style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                ),
              ),
              const SizedBox(height: 4),
              // Details Button
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFF1B3B5A),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: const [
                    Text("รายละเอียด", style: TextStyle(color: Colors.white, fontSize: 10)),
                    Icon(Icons.arrow_right, color: Colors.white, size: 14),
                  ],
                ),
              ),
              const SizedBox(height: 4),
              // Adopters Button
              GestureDetector(
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => CatAdoptersListScreen(
                        catId: int.tryParse(cat['cat_id'].toString()) ?? 0, 
                        catName: cat['pet_name'].toString(),
                        isAdopted: listStatus == 'adopted',
                        posterId: widget.userId,
                      ),
                    ),
                  );
                },
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.pink[400],
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(listStatus != 'adopted' ? "ดูผู้ขอรับเลี้ยง" : "ดูรายละเอียดผู้รับเลี้ยง", style: const TextStyle(color: Colors.white, fontSize: 10)),
                      const Icon(Icons.group, color: Colors.white, size: 14),
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
