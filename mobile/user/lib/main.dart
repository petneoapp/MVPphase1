import 'package:flutter/material.dart';
import 'core/routes/app_router.dart';
import 'core/theme/app_colors.dart';
import 'core/widgets/connectivity_handler.dart';

import 'package:flutter_dotenv/flutter_dotenv.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await dotenv.load(fileName: ".env");
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'PetNeo',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: AppColors.primaryPink),
        useMaterial3: true,
      ),
      routerConfig: AppRouter.router,
      builder: (context, child) {
        return ConnectivityHandler(
          key: ConnectivityHandler.connectivityKey,
          child: child!,
        );
      },
    );
  }
}
