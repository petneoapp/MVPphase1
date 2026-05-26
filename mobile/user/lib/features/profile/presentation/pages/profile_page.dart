import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/image_helper.dart';

class ProfilePage extends StatefulWidget {
  const ProfilePage({super.key});

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  final ApiClient _apiClient = ApiClient();
  bool _isLoading = true;
  String _userName = 'Mohan';
  String? _profilePictureUrl;

  @override
  void initState() {
    super.initState();
    _fetchProfile();
  }

  Future<void> _fetchProfile() async {
    try {
      final response = await _apiClient.get(ApiConstants.profile);
      if (response['success'] == true) {
        final data = response['data'] as Map<String, dynamic>?;
        if (data != null) {
          final firstName = data['first_name'] as String? ?? '';
          final lastName = data['last_name'] as String? ?? '';
          setState(() {
            _userName = '$firstName $lastName'.trim();
            _profilePictureUrl = data['profile_picture_url'] as String?;
            _isLoading = false;
          });
        }
      } else {
        setState(() {
          _isLoading = false;
        });
      }
    } catch (_) {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        backgroundColor: AppColors.backgroundLightPurple,
        body: Center(
          child: CircularProgressIndicator(
            color: AppColors.primaryPink,
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.backgroundLightPurple,
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
              child: Align(
                alignment: Alignment.centerRight,
                child: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppColors.primaryPink.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.notifications_outlined, color: AppColors.primaryPink),
                ),
              ),
            ),
            const SizedBox(height: 8),
            Stack(
              children: [
                CircleAvatar(
                  radius: 50,
                  backgroundColor: const Color(0xFFEDEFFB),
                  child: ClipOval(
                    child: _profilePictureUrl != null && _profilePictureUrl!.isNotEmpty
                        ? Image.network(
                            ImageHelper.getSafeImageUrl(_profilePictureUrl) ?? _profilePictureUrl!,
                            width: 100,
                            height: 100,
                            fit: BoxFit.cover,
                            errorBuilder: (context, error, stackTrace) => const Icon(
                              Icons.person,
                              color: AppColors.primaryPink,
                              size: 40,
                            ),
                          )
                        : const Icon(
                            Icons.person,
                            color: AppColors.primaryPink,
                            size: 40,
                          ),
                  ),
                ),
                Positioned(
                  bottom: 4,
                  right: 6,
                  child: Container(
                    width: 14,
                    height: 14,
                    decoration: BoxDecoration(
                      color: Colors.green,
                      shape: BoxShape.circle,
                      border: Border.all(color: AppColors.backgroundLightPurple, width: 2),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(_userName, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            Expanded(
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 120),
                decoration: const BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
                ),
                child: SingleChildScrollView(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Settings', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 16),
                      _SettingItem(icon: Icons.vaccines, label: 'My Pets', onTap: () => context.push('/my-pets')),
                      _SettingItem(icon: Icons.badge, label: 'My Bio', onTap: () => context.push('/update-profile')),
                      _SettingItem(icon: Icons.location_on_outlined, label: 'My Addresses', onTap: () => context.push('/my-addresses')),
                      _SettingItem(icon: Icons.lock, label: 'Privacy', onTap: () => context.push('/privacy')),
                      _SettingItem(icon: Icons.help_outline, label: 'Help', onTap: () => context.push('/help')),
                      _SettingItem(icon: Icons.info_outline, label: 'About', onTap: () => context.push('/about')),
                      const SizedBox(height: 24),
                      SizedBox(
                        width: double.infinity,
                        height: 50,
                        child: ElevatedButton(
                          onPressed: () async {
                            final prefs = await SharedPreferences.getInstance();
                            await prefs.setBool('is_logged_in', false);
                            if (context.mounted) context.go('/welcome');
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primaryPink,
                            elevation: 0,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          ),
                          child: const Text('Logout', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15)),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SettingItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  const _SettingItem({required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 12),
        child: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: const BoxDecoration(
                color: AppColors.primaryPink,
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: Colors.white, size: 20),
            ),
            const SizedBox(width: 14),
            Expanded(child: Text(label, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600))),
            const Icon(Icons.chevron_right, color: Colors.black54),
          ],
        ),
      ),
    );
  }
}
