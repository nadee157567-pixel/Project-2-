import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'cat_detail_screen.dart';
import '../config/api_config.dart';

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

  Widget _buildCatGrid(List<dynamic> cats) {
    if (cats.isEmpty) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 20),
        child: Text("ยังไม่มีข้อมูลแมวในหมวดหมู่นี้", style: TextStyle(color: Colors.grey)),
      );
    }
    
    return GridView.builder(
      physics: const NeverScrollableScrollPhysics(),
      shrinkWrap: true,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 16,
        mainAxisSpacing: 16,
        childAspectRatio: 0.8, 
      ),
      itemCount: cats.length,
      itemBuilder: (context, index) {
        final Map<String, dynamic> cat = Map<String, dynamic>.from(cats[index]);
        cat['poster_id'] = widget.posterId;
        
        return GestureDetector(
          onTap: () {
            // Fetch detailed cat data and navigate
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => CatDetailScreen(
                  userId: widget.currentUserId,
                  catData: cat, // Basic data passed, detailed data fetched inside if necessary
                ),
              ),
            );
          },
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
                      Positioned(
                        top: 8,
                        right: 8,
                        child: Container(
                          padding: const EdgeInsets.all(4),
                          decoration: const BoxDecoration(
                            color: Colors.white,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.favorite_border, size: 16, color: Colors.pinkAccent),
                        ),
                      )
                    ],
                  ),
                ),
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
    );
  }

  Widget _buildSectionTitle(String title) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.pink[200],
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        title,
        style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.black87),
      ),
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
                              Text(
                                posterInfo?['role'] == 'poster' ? 'ผู้ประกาศหาบ้าน' : 'ผู้รับเลี้ยง',
                                style: TextStyle(color: Colors.grey[700], fontSize: 13),
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

                  // Cats seeking homes
                  Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildSectionTitle("แมวที่กำลังหาบ้าน"),
                        const SizedBox(height: 16),
                        _buildCatGrid(activeCats),
                        
                        const SizedBox(height: 30),
                        
                        // Adopted cats
                        _buildSectionTitle("แมวที่ได้บ้านที่อบอุ่นแล้ว"),
                        const SizedBox(height: 16),
                        _buildCatGrid(adoptedCats),
                      ],
                    ),
                  ),
                ],
              ),
            ),
    );
  }
}
