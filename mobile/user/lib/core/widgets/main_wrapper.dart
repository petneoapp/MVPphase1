import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_colors.dart';

class MainWrapper extends StatelessWidget {
  final Widget child;
  const MainWrapper({super.key, required this.child});

  static const _routes = [
    '/home',
    '/my-appointments',
    '/emergency',
    '/community',
    '/profile',
  ];

  int _currentIndex(BuildContext context) {
    final loc = GoRouterState.of(context).uri.toString();
    for (int i = 0; i < _routes.length; i++) {
      if (loc.startsWith(_routes[i])) return i;
    }
    return 0;
  }

  void _onTap(BuildContext context, int index) {
    context.go(_routes[index]);
  }

  @override
  Widget build(BuildContext context) {
    final currentIndex = _currentIndex(context);
    return Scaffold(
      extendBody: true,
      backgroundColor: AppColors.backgroundLightPurple,
      body: child,
      bottomNavigationBar: SafeArea(
        top: false,
        child: Container(
          height: 88,
          color: Colors.transparent,
          child: Stack(
            clipBehavior: Clip.none,
            children: [
            // Custom Painted Background Curve
            Positioned.fill(
              child: CustomPaint(
                painter: NavCurvePainter(),
              ),
            ),
            // Flat Navigation Bar Items
            Positioned(
              left: 0,
              right: 0,
              bottom: 0,
              height: 64,
              child: Row(
                children: [
                  Expanded(child: _buildNavItem(context, 0, currentIndex, Icons.home_outlined, Icons.home, 'Home')),
                  Expanded(child: _buildNavItem(context, 1, currentIndex, Icons.calendar_month_outlined, Icons.calendar_month, 'My Appointments')),
                  const SizedBox(width: 80), // Space for Emergency FAB hump
                  Expanded(child: _buildNavItem(context, 3, currentIndex, Icons.people_outline, Icons.people, 'Community')),
                  Expanded(child: _buildNavItem(context, 4, currentIndex, Icons.person_outline, Icons.person, 'Profile')),
                ],
              ),
            ),
            // Center Docked Emergency FAB
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              child: Center(
                child: _EmergencyFab(
                  isActive: currentIndex == 2,
                  onTap: () => _onTap(context, 2),
                ),
              ),
            ),
          ],
        ),
      ),
    ),
  );
}

  Widget _buildNavItem(
    BuildContext context,
    int index,
    int currentIndex,
    IconData icon,
    IconData activeIcon,
    String label,
  ) {
    final isSelected = currentIndex == index;
    final color = isSelected ? AppColors.primaryPink : AppColors.grey;
    return InkWell(
      onTap: () => _onTap(context, index),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(isSelected ? activeIcon : icon, color: color, size: 24),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 10,
              color: color,
              fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
            ),
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}

class _EmergencyFab extends StatelessWidget {
  final bool isActive;
  final VoidCallback onTap;
  const _EmergencyFab({required this.isActive, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 84,
      width: 72,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          GestureDetector(
            onTap: onTap,
            child: Container(
              height: 56,
              width: 56,
              decoration: BoxDecoration(
                color: AppColors.primaryPink,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primaryPink.withOpacity(0.3),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              alignment: Alignment.center,
              child: const Icon(
                Icons.emergency,
                color: Color(0xFFFFD600),
                size: 30,
              ),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Emergency',
            style: TextStyle(
              fontSize: 10,
              color: AppColors.primaryPink,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }
}

class NavCurvePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.fill;

    final path = Path();
    // Top line is offset down by 24 pixels to make room for the hump
    const double topOffset = 24.0;
    path.moveTo(0, topOffset);

    final center = size.width / 2;
    // Hump properties
    const double humpWidth = 42.0; // radius of curve influence from center

    path.lineTo(center - humpWidth - 15, topOffset);

    // Smooth bezier curve transition into the hump
    path.quadraticBezierTo(
      center - humpWidth,
      topOffset,
      center - humpWidth + 6,
      topOffset - 6,
    );

    // Upward bulging curve to frame the FAB
    path.quadraticBezierTo(
      center,
      -14, // bulge peak goes past top of container
      center + humpWidth - 6,
      topOffset - 6,
    );

    // Smooth bezier curve transition back to flat top edge
    path.quadraticBezierTo(
      center + humpWidth,
      topOffset,
      center + humpWidth + 15,
      topOffset,
    );

    path.lineTo(size.width, topOffset);
    path.lineTo(size.width, size.height);
    path.lineTo(0, size.height);
    path.close();

    // Premium navigation bar shadow
    canvas.drawShadow(
      path.shift(const Offset(0, -1)),
      Colors.black.withOpacity(0.06),
      8.0,
      true,
    );

    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
