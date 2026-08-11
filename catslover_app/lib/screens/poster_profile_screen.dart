import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'cat_detail_screen.dart';
import '../config/api_config.dart';
import 'cat_adopters_list_screen.dart';
import 'cat_profile_form_screen.dart';

class PosterProfileScreen extends StatefulWidget {
  final int posterId;
  final int currentUserId; // Required for navigating to CatDetailScreen

  const PosterProfileScreen({super.key, required this.posterId, required this.currentUserId});

  @override
  State<PosterProfileScreen> createState() => _PosterProfileScreenState();
}

class _PosterProfileScreenState extends State<PosterProfileScreen> {
  Map<String, dynamic>? posterInfo;
  List<dynamic> activeCats = [];
  List<dynamic> adoptedCats = [];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    fetchPosterData();
  }

  Future<void> fetchPosterData() async {
    try {
      // 1. Fetch poster profile info
      final userResponse = await http.get(Uri.parse(ApiConfig.baseUrl + '/auth/user/${widget.posterId}'));
      if (userResponse.statusCode == 200) {
        final userData = jsonDecode(userResponse.body);
        if (userData['success'] == true && userData['data'] != null) {
          posterInfo = userData['data'];
        }
      }

      // 2. Fetch poster's cats
      final catsResponse = await http.get(Uri.parse(ApiConfig.baseUrl + '/cats/poster/${widget.posterId}'));
      if (catsResponse.statusCode == 200) {
        final catData = jsonDecode(catsResponse.body);
        if (catData['success'] == true && catData['data'] != null) {
          final cats = catData['data'] as List;
          
          if (!mounted) return;
          setState(() {
            activeCats = cats.where((cat) => cat['status'] != 'adopted').toList();
            adoptedCats = cats.where((cat) => cat['status'] == 'adopted').toList();
            isLoading = false;
          });
        } else {
          setState(() { isLoading = false; });
        }
      } else {
        setState(() { isLoading = false; });
      }
    } catch (e) {
      print("Error fetching poster data: $e");
      setState(() { isLoading = false; });
    }
  }

  String _formatDate(String? isoDate) {
    if (isoDate == null) return "ไม่ระบุ";
    try {
      final date = DateTime.parse(isoDate);
      // Create Thai Date String e.g. "ม.ค 2569"
      final List<String> thaiMonths = ["ม.ค", "ก.พ", "มี.ค", "เม.ย", "พ.ค", "มิ.ย", "ก.ค", "ส.ค", "ก.ย", "ต.ค", "พ.ย", "ธ.ค"];
      final month = thaiMonths[date.month - 1];
      final year = date.year + 543;
      return "$month $year";
    } catch (e) {
      return "-";
    }
  }

  Widget _buildCatList(List cats, String listStatus) {
    if (cats.isEmpty) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 10),
        child: Text("ยังไม่มีข้อมูลแมวในหมวดหมู่นี้", style: TextStyle(color: Colors.grey, fontSize: 13)),
      );
    }

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 10,
        mainAxisSpacing: 10,
        childAspectRatio: widget.currentUserId == widget.posterId ? 0.6 : 0.72,
      ),
      itemCount: cats.length,
      itemBuilder: (context, index) {
        final Map<String, dynamic> cat = Map<String, dynamic>.from(cats[index]);
        cat['poster_id'] = widget.posterId;
        final String currentStatus = cat['status'] ?? 'available';

        return GestureDetector(
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => CatDetailScreen(
                  userId: widget.currentUserId,
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
                Text(cat['pet_name'] ?? 'ไม่ทราบชื่อ', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                Text("${cat['pet_breed'] ?? ''} • ${ApiConfig.getShortAgeDesc(cat['age_months'])}", style: const TextStyle(fontSize: 10, color: Colors.grey)),
                const SizedBox(height: 4),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: currentStatus == 'available' ? Colors.green : (currentStatus == 'pending' ? Colors.orange : Colors.grey),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    currentStatus == 'available' ? "ว่าง" : (currentStatus == 'pending' ? "มีผู้ขอรับเลี้ยง" : "ได้บ้านแล้ว"),
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
                // Adopters Button (Only if widget.currentUserId == widget.posterId)
                if (widget.currentUserId == widget.posterId)
                  GestureDetector(
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => CatAdoptersListScreen(
                            catId: int.tryParse(cat['cat_id'].toString()) ?? 0,
                            catName: cat['pet_name'] ?? 'น้องแมว',
                            isAdopted: currentStatus == 'adopted',
                            posterId: widget.posterId,
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
                      child: const Center(
                        child: Text(
                          "ดูผู้ขอรับเลี้ยง",
                          style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildCategoryPill(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(text, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFFF5F5), // Pale pink background
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.more_vert, color: Colors.white),
            onPressed: () {},
          )
        ],
        flexibleSpace: Container(
          decoration: BoxDecoration(
            color: Colors.pink[300],
          ),
        ),
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator(color: Colors.pink))
          : SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header section
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 30),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: const BorderRadius.only(
                        bottomLeft: Radius.circular(30),
                        bottomRight: Radius.circular(30),
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.05),
                          blurRadius: 10,
                          offset: const Offset(0, 5),
                        ),
                      ],
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        // Avatar
                        Container(
                          width: 80,
                          height: 80,
                          decoration: BoxDecoration(
                            color: Colors.indigo[200],
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.person, size: 50, color: Colors.white),
                        ),
                        const SizedBox(width: 20),
                        // User Details
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Text(
                                    posterInfo?['fullname'] ?? 'ไม่ระบุชื่อ',
                                    style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                                  ),
                                  const SizedBox(width: 8),
                                  const Icon(Icons.verified, color: Colors.blue, size: 18),
                                ],
                              ),
                              const SizedBox(height: 4),
                              const Text(
                                'ผู้ประกาศหาบ้าน',
                                style: TextStyle(color: Colors.grey, fontSize: 13),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                "เข้าร่วมเมื่อ ${_formatDate(posterInfo?['created_at'])}",
                                style: TextStyle(color: Colors.grey[500], fontSize: 12),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Show Register Button ONLY if viewing own profile
                  if (widget.currentUserId == widget.posterId)
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          const Text(
                            "กำลังมองหาบ้านที่อบอุ่นให้เจ้าเหมียวใช่ไหม?",
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 10),
                          ElevatedButton(
                            onPressed: () async {
                              await Navigator.push(
                                context,
                                MaterialPageRoute(builder: (context) => CatProfileFormScreen(userId: widget.posterId)),
                              );
                              fetchPosterData(); // Refresh list after returning
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
                          const SizedBox(height: 20),
                        ],
                      ),
                    ),

                  // Cats seeking homes
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          "ประวัติการโพสต์หาบ้าน",
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 10),
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFFE4E4),
                            borderRadius: BorderRadius.circular(15),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _buildCategoryPill("แมวที่กำลังหาบ้าน", Colors.pink[200]!),
                              const SizedBox(height: 10),
                              _buildCatList(activeCats, 'active'),
                              const SizedBox(height: 20),
                              _buildCategoryPill("แมวที่ได้บ้านที่อบอุ่นแล้ว", Colors.pink[300]!),
                              const SizedBox(height: 10),
                              _buildCatList(adoptedCats, 'adopted'),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
    );
  }
}
