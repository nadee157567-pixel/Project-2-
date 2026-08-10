import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../config/api_config.dart';

class ChatMessageScreen extends StatefulWidget {
  final int roomId;
  final int userId;
  final String partnerName;

  const ChatMessageScreen({
    super.key,
    required this.roomId,
    required this.userId,
    required this.partnerName,
  });

  @override
  State<ChatMessageScreen> createState() => _ChatMessageScreenState();
}

class _ChatMessageScreenState extends State<ChatMessageScreen> {
  List<dynamic> _messages = [];
  bool _isLoading = true;
  final TextEditingController _messageController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _fetchMessages();
    _markAsRead();
  }

  String _formatTime(String? dateStr) {
    if (dateStr == null) return '';
    try {
      final date = DateTime.parse(dateStr).toLocal();
      final h = date.hour.toString().padLeft(2, '0');
      final m = date.minute.toString().padLeft(2, '0');
      return "$h:$m";
    } catch (e) {
      return '';
    }
  }

  String _formatDate(String? dateStr) {
    if (dateStr == null) return '';
    try {
      final date = DateTime.parse(dateStr).toLocal();
      final now = DateTime.now();
      final today = DateTime(now.year, now.month, now.day);
      final yesterday = today.subtract(const Duration(days: 1));
      final msgDay = DateTime(date.year, date.month, date.day);
      if (msgDay == today) return 'วันนี้';
      if (msgDay == yesterday) return 'เมื่อวาน';
      return '${date.day}/${date.month}/${date.year}';
    } catch (e) {
      return '';
    }
  }

  bool _isSameDay(String? a, String? b) {
    if (a == null || b == null) return false;
    try {
      final da = DateTime.parse(a).toLocal();
      final db = DateTime.parse(b).toLocal();
      return da.year == db.year && da.month == db.month && da.day == db.day;
    } catch (e) {
      return false;
    }
  }

  Widget _buildDateDivider(String label) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Row(
        children: [
          const Expanded(child: Divider(thickness: 1, color: Color(0xFFE0E0E0))),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Text(
              label,
              style: TextStyle(fontSize: 12, color: Colors.grey[500], fontWeight: FontWeight.w500),
            ),
          ),
          const Expanded(child: Divider(thickness: 1, color: Color(0xFFE0E0E0))),
        ],
      ),
    );
  }

  Future<void> _markAsRead() async {
    try {
      await http.put(
        Uri.parse('${ApiConfig.baseUrl}/chats/${widget.roomId}/read'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'userId': widget.userId}),
      );
    } catch (e) {
      print("Error marking as read: $e");
    }
  }

  Future<void> _fetchMessages() async {
    try {
      final response = await http.get(Uri.parse('${ApiConfig.baseUrl}/chats/${widget.roomId}/messages'));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true) {
          setState(() {
            _messages = data['data'];
            _isLoading = false;
          });
        }
      } else {
        setState(() => _isLoading = false);
      }
    } catch (e) {
      print("Error fetching messages: $e");
      setState(() => _isLoading = false);
    }
  }

  Future<void> _sendMessage() async {
    final text = _messageController.text.trim();
    if (text.isEmpty) return;
    
    // เคลียร์กล่องข้อความก่อนเพื่อความรวดเร็ว
    _messageController.clear();

    try {
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/chats/send-message'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'roomId': widget.roomId,
          'senderId': widget.userId,
          'messageText': text,
        }),
      );

      if (response.statusCode == 201) {
        final data = jsonDecode(response.body);
        if (data['success'] == true) {
          setState(() {
            _messages.add(data['data']); // นำข้อความที่เพิ่งส่งสำเร็จไปต่อท้าย list
          });
        }
      } else {
        print("Failed to send message: ${response.statusCode}");
      }
    } catch (e) {
      print("Error sending message: $e");
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFFF5F5),
      appBar: AppBar(
        title: Text(widget.partnerName, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        backgroundColor: Colors.pink[300],
        elevation: 0,
        centerTitle: true,
      ),
      body: Column(
        children: [
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: Colors.pink))
                : _messages.isEmpty
                    ? const Center(child: Text("ยังไม่มีข้อความสนทนา", style: TextStyle(color: Colors.grey)))
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _messages.length,
                        itemBuilder: (context, index) {
                          final msg = _messages[index];
                          final bool isMe = msg['sender_id'] == widget.userId;
                          final String? prevDate = index > 0 ? _messages[index - 1]['sent_at'] : null;
                          final bool showDate = !_isSameDay(prevDate, msg['sent_at']);

                          return Column(
                            children: [
                              if (showDate) _buildDateDivider(_formatDate(msg['sent_at'])),
                              Align(
                                alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
                                child: Padding(
                                  padding: const EdgeInsets.only(bottom: 12),
                                  child: Column(
                                    crossAxisAlignment: isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                        decoration: BoxDecoration(
                                          color: isMe ? Colors.pink[200] : Colors.white,
                                          borderRadius: BorderRadius.circular(20).copyWith(
                                            bottomRight: isMe ? const Radius.circular(0) : const Radius.circular(20),
                                            bottomLeft: !isMe ? const Radius.circular(0) : const Radius.circular(20),
                                          ),
                                          boxShadow: [
                                            BoxShadow(
                                              color: Colors.black.withOpacity(0.05),
                                              blurRadius: 5,
                                              offset: const Offset(0, 2),
                                            ),
                                          ],
                                        ),
                                        child: Text(
                                          msg['message_text'] ?? '',
                                          style: TextStyle(
                                            color: isMe ? Colors.white : Colors.black87,
                                            fontSize: 16,
                                          ),
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          if (isMe && msg['is_read'] == 1) ...[
                                            Text(
                                              "อ่านแล้ว",
                                              style: TextStyle(
                                                color: Colors.grey[600],
                                                fontSize: 11,
                                              ),
                                            ),
                                            const SizedBox(width: 4),
                                          ],
                                          Text(
                                            _formatTime(msg['sent_at']),
                                            style: TextStyle(
                                              color: Colors.grey[600],
                                              fontSize: 12,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          );
                        },
                      ),
          ),
          
          // พื้นที่พิมพ์ข้อความ
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 10,
                  offset: const Offset(0, -5),
                )
              ],
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _messageController,
                    decoration: InputDecoration(
                      hintText: "พิมพ์ข้อความ...",
                      hintStyle: TextStyle(color: Colors.grey[400]),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(30),
                        borderSide: BorderSide.none,
                      ),
                      filled: true,
                      fillColor: Colors.grey[100],
                      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Container(
                  decoration: BoxDecoration(
                    color: Colors.pink[300],
                    shape: BoxShape.circle,
                  ),
                  child: IconButton(
                    icon: const Icon(Icons.send, color: Colors.white),
                    onPressed: _sendMessage,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
