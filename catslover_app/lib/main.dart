// import 'package:flutter/material.dart';
// import 'screens/home_screen.dart';

// void main() {
//   runApp(MyApp());
// }

// class MyApp extends StatelessWidget {
//   @override
//   Widget build(BuildContext context) {
//     return MaterialApp(
//       title: 'CatsLover App',
//       theme: ThemeData(
//         primarySwatch: Colors.orange,
//       ),
//       home: HomeScreen(), // กำหนดให้หน้าแรกคือ HomeScreen
//       debugShowCheckedModeBanner: false, // เอาแถบ Debug สีแดงๆ มุมขวาบนออก
//     );
//   }
// // }


// import 'package:flutter/material.dart';
// import 'package:catslover_app/screens/cat_evaluation_screen.dart'; // เช็ค path ให้ตรงกับไฟล์ของคุณ

// void main() {
//   runApp(const MyApp());
// }

// class MyApp extends StatelessWidget {
//   const MyApp({super.key});

//   @override
//   Widget build(BuildContext context) {
//     return MaterialApp(
//       title: 'CatsLover',
//       theme: ThemeData(
//         primarySwatch: Colors.pink,
//       ),
//       // ใส่ userId: 4 และ catId: 1 เพื่อทดสอบดึงข้อมูลชุดเดียวกับในเบราว์เซอร์
//       home: const EvaluationScreen(userId: 3, catId: 2), 
//     );
//   }
// }


// import 'package:flutter/material.dart';
// // 1. เพิ่มบรรทัดนี้เพื่อดึงไฟล์หน้าจอใหม่เข้ามา
// import 'screens/adopter_profile_screen.dart'; 

// void main() {
//   runApp(const MyApp());
// }

// class MyApp extends StatelessWidget {
//   const MyApp({super.key});

//   @override
//   Widget build(BuildContext context) {
//     return MaterialApp(
//       title: 'CatsLover',
//       theme: ThemeData(
//         primarySwatch: Colors.pink,
//       ),
//       // 2. เปลี่ยนตรง home ให้เรียกใช้ AdopterProfileScreen (ใส่ userId จำลองไปก่อน)
//       home: const AdopterProfileScreen(userId: 4), 
//     );
//   }
// }

import 'package:flutter/material.dart';
import 'screens/landing_screen.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'CatsLover',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        primarySwatch: Colors.pink,
      ),
      home: const LandingScreen(), 
    );
  }
}