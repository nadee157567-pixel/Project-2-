import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class CatAdoptersListScreen extends StatefulWidget {
  final int catId;
  final String catName;

  const CatAdoptersListScreen({
    super.key,
    required this.catId,
    required this.catName,
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

  Future<void> _fetchAdopters() async {
    try {
      final response = await http.get(Uri.parse('http://10.0.2.2:3000/api/adoption/cat/${widget.catId}'));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        setState(() {
          _adopters = data['data'];
        });
      }
    } catch (e) {
      print("Error fetching adopters: $e");
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFFF0F0),
      appBar: AppBar(
        backgroundColor: const Color(0xFFFFA0A0),
        elevation: 0,
        title: Text('ผู้ขอรับเลี้ยง: ${widget.catName}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
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
                            _buildInfoRow(Icons.home, "ที่พัก", adopter['living_space_type'] ?? '-'),
                            _buildInfoRow(Icons.pets, "ประสบการณ์", adopter['experience'] ?? '-'),
                            if (adopter['upload_remark'] != null && adopter['upload_remark'].toString().isNotEmpty)
                              Padding(
                                padding: const EdgeInsets.only(top: 12.0),
                                child: Text("หมายเหตุ: ${adopter['upload_remark']}", style: const TextStyle(fontStyle: FontStyle.italic, color: Colors.grey)),
                              ),
                            const SizedBox(height: 16),
                            SizedBox(
                              width: double.infinity,
                              child: ElevatedButton.icon(
                                onPressed: () {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(content: Text('กำลังติดต่อไปยังผู้ขอรับเลี้ยง...')),
                                  );
                                },
                                icon: const Icon(Icons.phone, size: 18),
                                label: const Text("ติดต่อผู้ขอรับเลี้ยง"),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.green,
                                  foregroundColor: Colors.white,
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                ),
                              ),
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
