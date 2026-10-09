import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../config/api_config.dart';
import 'chat_message_screen.dart';

class ChatListScreen extends StatefulWidget {
  final int userId;
  final VoidCallback? onRefreshUnread;

  const ChatListScreen({super.key, required this.userId, this.onRefreshUnread});

  @override
  State<ChatListScreen> createState() => _ChatListScreenState();
}

class _ChatListScreenState extends State<ChatListScreen> {
  List<dynamic> _chats = [];
  bool _isLoading = true;
  String _filterType = 'all'; // 'all', 'adopter', 'poster'

  @override
  void initState() {
    super.initState();
    _fetchChats();
  }

  String _formatTime(String? dateStr) {
    if (dateStr == null) return '';
    try {
      final date = DateTime.parse(dateStr).toLocal();
      final now = DateTime.now();
      
      // ถ้าเป็นวันนี้ แสดงเวลา
      if (date.year == now.year && date.month == now.month && date.day == now.day) {
        final h = date.hour.toString().padLeft(2, '0');
        final m = date.minute.toString().padLeft(2, '0');
        return "$h:$m";
      }
      
      // ถ้าไม่ใช่ของวันนี้ แสดงวันที่
      return "${date.day}/${date.month}/${date.year.toString().substring(2)}";
    } catch (e) {
      return '';
    }
  }

  Future<void> _fetchChats() async {
    try {
      final response = await http.get(Uri.parse('${ApiConfig.baseUrl}/chats?userId=${widget.userId}'));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true && data['data'] != null) {
          if (!mounted) return;
          setState(() {
            _chats = data['data'];
            _isLoading = false;
          });
          if (widget.onRefreshUnread != null) {
            widget.onRefreshUnread!();
          }
        }
      } else {
        if (!mounted) return;
        setState(() => _isLoading = false);
      }
    } catch (e) {
      if (!mounted) return;
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFFF5F5),
      appBar: AppBar(
        title: const Text('ข้อความ', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        backgroundColor: Colors.pink[300],
        elevation: 0,
        centerTitle: true,
      ),
      body: Column(
        children: [
          // แถบเลือกประเภทแชท
          Container(
            color: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
            child: Row(
              children: [
                Expanded(child: _buildFilterChip('ทั้งหมด', 'all')),
                const SizedBox(width: 8),
                Expanded(child: _buildFilterChip('ขอรับเลี้ยง', 'adopter')),
                const SizedBox(width: 8),
                Expanded(child: _buildFilterChip('หาบ้าน', 'poster')),
              ],
            ),
          ),
          
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: Colors.pink))
                : _getFilteredChats().isEmpty
                    ? const Center(child: Text("ยังไม่มีข้อความสนทนา", style: TextStyle(color: Colors.grey)))
                    : ListView.builder(
                        itemCount: _getFilteredChats().length,
                        itemBuilder: (context, index) {
                          final chat = _getFilteredChats()[index];
                          
                          // หาว่าเราคุยกับใคร
                          final isApplicant = chat['applicant_id'] == widget.userId;
                          final String chatPartnerName = isApplicant ? chat['poster_name'] : chat['applicant_name'];
                          final String partnerRole = isApplicant ? "เจ้าของแมว" : "ผู้ขอรับเลี้ยง";
                          int unreadCount = chat['unread_count'] ?? 0;
                          bool hasUnread = unreadCount > 0;
                          
                          return Card(
                            margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                            elevation: 2,
                            child: ListTile(
                              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                              leading: CircleAvatar(
                                backgroundColor: Colors.pink[100],
                                radius: 25,
                                child: const Icon(Icons.person, color: Colors.white, size: 30),
                              ),
                              title: Text(
                                chatPartnerName,
                                style: TextStyle(fontWeight: hasUnread ? FontWeight.bold : FontWeight.w600, fontSize: 16),
                              ),
                              subtitle: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    "เรื่อง: น้อง${chat['pet_name'] ?? 'ไม่ทราบชื่อ'} ($partnerRole)",
                                    style: TextStyle(color: Colors.pink[400], fontSize: 12),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    chat['last_message'] ?? 'เริ่มการสนทนาใหม่',
                                    style: TextStyle(
                                      color: hasUnread ? Colors.black87 : Colors.grey[600],
                                      fontWeight: hasUnread ? FontWeight.bold : FontWeight.normal,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ],
                              ),
                              trailing: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Text(
                                    _formatTime(chat['last_message_time'] ?? chat['created_at']),
                                    style: TextStyle(
                                      color: hasUnread ? Colors.pink : Colors.grey[500],
                                      fontSize: 12,
                                    ),
                                  ),
                                  if (hasUnread) ...[
                                    const SizedBox(height: 6),
                                    Container(
                                      padding: const EdgeInsets.all(6),
                                      decoration: const BoxDecoration(
                                        color: Colors.pink,
                                        shape: BoxShape.circle,
                                      ),
                                      child: Text(
                                        unreadCount > 9 ? '9+' : unreadCount.toString(),
                                        style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                                      ),
                                    ),
                                  ] else ...[
                                    const SizedBox(height: 6),
                                    Icon(Icons.chevron_right, color: Colors.grey[300], size: 20),
                                  ],
                                ],
                              ),
                              onTap: () async {
                                await Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) => ChatMessageScreen(
                                      roomId: chat['room_id'],
                                      userId: widget.userId,
                                      partnerId: isApplicant ? chat['poster_id'] : chat['applicant_id'],
                                      partnerName: chatPartnerName,
                                      applicationStatus: chat['application_status'],
                                      catId: chat['cat_id'], // Need to make sure chat has cat_id
                                    ),
                                  ),
                                );
                                _fetchChats();
                                if (widget.onRefreshUnread != null) {
                                  widget.onRefreshUnread!();
                                }
                              },
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, String value) {
    return ChoiceChip(
      label: Container(
        width: double.infinity,
        alignment: Alignment.center,
        child: Text(label),
      ),
      showCheckmark: true,
      selected: _filterType == value,
      onSelected: (bool selected) {
        if (selected) {
          setState(() {
            _filterType = value;
          });
        }
      },
      selectedColor: Colors.pink[200],
      backgroundColor: Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: BorderSide(color: _filterType == value ? Colors.pink : Colors.grey[300]!),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
      labelStyle: TextStyle(
        color: _filterType == value ? Colors.pink[900] : Colors.black87,
        fontWeight: _filterType == value ? FontWeight.bold : FontWeight.normal,
        fontSize: 14,
      ),
    );
  }

  List<dynamic> _getFilteredChats() {
    if (_filterType == 'adopter') {
      return _chats.where((chat) => chat['applicant_id'] == widget.userId).toList();
    } else if (_filterType == 'poster') {
      return _chats.where((chat) => chat['poster_id'] == widget.userId).toList();
    }
    return _chats;
  }
}
