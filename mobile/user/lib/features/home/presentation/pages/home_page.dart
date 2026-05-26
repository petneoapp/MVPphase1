import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/petneo_header.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/constants/api_constants.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  final ApiClient _apiClient = ApiClient();
  bool _isLoading = true;
  String _userName = 'Ram Kishore';
  int _unreadNotifications = 0;
  List<dynamic> _pets = [];
  String _currentLocationStr = 'Locating...';

  @override
  void initState() {
    super.initState();
    _fetchHomeContent();
    _initLocationService();
  }

  Future<void> _initLocationService() async {
    try {
      final serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        if (!mounted) return;
        setState(() => _currentLocationStr = 'Location services disabled');
        final shouldOpen = await showDialog<bool>(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text('Turn on Location'),
            content: const Text('Location services are off. Enable GPS to see nearby vets and services.'),
            actions: [
              TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Not now')),
              TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Open settings')),
            ],
          ),
        );
        if (shouldOpen == true) {
          await Geolocator.openLocationSettings();
        }
        return;
      }

      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.deniedForever) {
        if (!mounted) return;
        setState(() => _currentLocationStr = 'Location permission denied');
        final shouldOpen = await showDialog<bool>(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text('Permission required'),
            content: const Text('Location permission is permanently denied. Enable it from app settings to use location features.'),
            actions: [
              TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Not now')),
              TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Open settings')),
            ],
          ),
        );
        if (shouldOpen == true) {
          await Geolocator.openAppSettings();
        }
        return;
      }
      if (permission == LocationPermission.denied) {
        if (!mounted) return;
        setState(() => _currentLocationStr = 'Location permission denied');
        return;
      }

      Position position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.low,
        timeLimit: const Duration(seconds: 5),
      );
      List<Placemark> placemarks = await placemarkFromCoordinates(position.latitude, position.longitude);
      if (!mounted) return;
      if (placemarks.isNotEmpty) {
        final p = placemarks.first;
        final locality = p.locality ?? p.subLocality ?? 'Unknown';
        final state = p.administrativeArea ?? 'Unknown';
        setState(() {
          _currentLocationStr = '$locality, $state';
        });
      } else {
        setState(() => _currentLocationStr = 'Location unavailable');
      }
    } catch (e) {
      if (!mounted) return;
      setState(() => _currentLocationStr = 'Location unavailable');
    }
  }

  Future<void> _fetchHomeContent() async {
    try {
      final response = await _apiClient.get(ApiConstants.home);
      if (response['success'] == true) {
        final data = response['data'] as Map<String, dynamic>?;
        if (data != null) {
          final user = data['user'] as Map<String, dynamic>?;
          final petsList = data['pets'] as List<dynamic>?;
          final notifications = data['unread_notifications'] as int?;

          setState(() {
            if (user != null && user['name'] != null) {
              _userName = user['name'] as String;
            }
            if (petsList != null) {
              _pets = petsList;
            }
            if (notifications != null) {
              _unreadNotifications = notifications;
            }
            _isLoading = false;
          });
        }
      } else {
        setState(() {
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        backgroundColor: Colors.white,
        body: Center(
          child: CircularProgressIndicator(
            color: AppColors.primaryPink,
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            PetneoHeader(
              showNotification: true,
              notificationCount: _unreadNotifications,
              leading: SvgPicture.asset(
                'assets/toolbarimage.svg',
                height: 26,
                fit: BoxFit.contain,
              ),
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.only(top: 8, bottom: 120),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text.rich(
                            TextSpan(
                              text: 'Hello, ',
                              style: const TextStyle(
                                fontSize: 22,
                                fontWeight: FontWeight.bold,
                                color: Colors.black,
                              ),
                              children: [
                                TextSpan(
                                  text: _userName,
                                  style: const TextStyle(color: AppColors.primaryPink),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              const Icon(Icons.location_on, color: Colors.red, size: 16),
                              const SizedBox(width: 4),
                              Text(
                                _currentLocationStr,
                                style: const TextStyle(
                                  color: Colors.red,
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 20),
                          // Pets horizontal scrolling row
                          SingleChildScrollView(
                            scrollDirection: Axis.horizontal,
                            child: Row(
                              children: [
                                ..._pets.map((pet) {
                                  final petName = pet['name'] as String? ?? 'Pet';
                                  final petImageUrl = pet['profile_url'] as String?;
                                  return Padding(
                                    padding: const EdgeInsets.only(right: 16),
                                    child: _PetItem(
                                      name: petName,
                                      imageUrl: petImageUrl,
                                      onTap: () {
                                        final petId = pet['id']?.toString() ?? '';
                                        if (petId.isNotEmpty) {
                                          context.push('/pet-view-details?id=$petId');
                                        } else {
                                          context.push('/my-pets');
                                        }
                                      },
                                    ),
                                  );
                                }).toList(),
                                _AddPetButton(onTap: () => context.push('/pet-details')),
                              ],
                            ),
                          ),
                          const SizedBox(height: 28),
                          const Text(
                            'Quick Services for Your Pet',
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 16),
                          GridView.count(
                            padding: EdgeInsets.zero,
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            crossAxisCount: 3,
                            mainAxisSpacing: 16,
                            crossAxisSpacing: 16,
                            childAspectRatio: 0.8,
                            children: [
                              _ServiceItem(title: 'Clinic Visit', imagePath: 'assets/m1.svg', onTap: () => context.push('/vets-list?visit_type=in-clinic')),
                              _ServiceItem(title: 'Home Visit', imagePath: 'assets/m2.svg', onTap: () => context.push('/vets-list?visit_type=home-visit')),
                              _ServiceItem(title: 'Online', imagePath: 'assets/m3.svg', onTap: () => context.push('/vets-list?visit_type=online')),
                              _ServiceItem(title: 'Boarding', imagePath: 'assets/m4.svg', onTap: () => context.push('/vets-list')),
                              _ServiceItem(title: 'Grooming', imagePath: 'assets/m5.svg', onTap: () => context.push('/vets-list')),
                              _ServiceItem(title: 'Products', imagePath: 'assets/m6.svg', onTap: () => context.push('/vets-list')),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),
                    // Emergency Section
                    Container(
                      width: double.infinity,
                      clipBehavior: Clip.antiAlias,
                      decoration: const BoxDecoration(
                        color: Colors.transparent,
                      ),
                      child: Stack(
                        children: [
                          Positioned.fill(
                            child: SvgPicture.asset(
                              'assets/emergencybg.svg',
                              fit: BoxFit.fill,
                            ),
                          ),
                          Padding(
                            padding: const EdgeInsets.fromLTRB(16, 20, 16, 40),
                            child: Container(
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(16),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withOpacity(0.02),
                                    blurRadius: 10,
                                    offset: const Offset(0, 4),
                                  ),
                                ],
                              ),
                              padding: const EdgeInsets.all(16),
                              child: Stack(
                                children: [
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Padding(
                                        padding: const EdgeInsets.only(right: 66),
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            const Text(
                                              'Facing an Emergency?',
                                              style: TextStyle(
                                                fontSize: 16,
                                                fontWeight: FontWeight.bold,
                                                color: Colors.black,
                                              ),
                                            ),
                                            const SizedBox(height: 6),
                                            Text(
                                              'Get urgent care for your pet-fast',
                                              style: TextStyle(
                                                fontSize: 12,
                                                color: Colors.grey[600],
                                                fontWeight: FontWeight.w500,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                      const SizedBox(height: 14),
                                      SizedBox(
                                        width: double.infinity,
                                        height: 44,
                                        child: ElevatedButton(
                                          onPressed: () => context.go('/emergency'),
                                          style: ElevatedButton.styleFrom(
                                            backgroundColor: const Color(0xFFF7B928),
                                            elevation: 0,
                                            shape: RoundedRectangleBorder(
                                              borderRadius: BorderRadius.circular(12),
                                            ),
                                          ),
                                          child: const Text(
                                            'Emergency',
                                            style: TextStyle(
                                              color: Colors.black,
                                              fontWeight: FontWeight.bold,
                                              fontSize: 14,
                                            ),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                  Positioned(
                                    top: 0,
                                    right: 0,
                                    child: Image.asset(
                                      'assets/ic_emergency.png',
                                      width: 58,
                                      height: 58,
                                      fit: BoxFit.contain,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PetItem extends StatelessWidget {
  final String name;
  final String? imageUrl;
  final VoidCallback onTap;

  const _PetItem({
    required this.name,
    this.imageUrl,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          CircleAvatar(
            radius: 32,
            backgroundColor: const Color(0xFFEDEFFB),
            child: ClipOval(
              child: imageUrl != null && imageUrl!.isNotEmpty
                  ? Image.network(
                      imageUrl!,
                      width: 64,
                      height: 64,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) => const Icon(
                        Icons.pets,
                        color: AppColors.primaryPink,
                        size: 28,
                      ),
                    )
                  : const Icon(
                      Icons.pets,
                      color: AppColors.primaryPink,
                      size: 28,
                    ),
            ),
          ),
          const SizedBox(height: 6),
          Text(
            name.trim(),
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: Colors.black87,
            ),
          ),
        ],
      ),
    );
  }
}

class _AddPetButton extends StatelessWidget {
  final VoidCallback onTap;
  const _AddPetButton({required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: const [
          CircleAvatar(
            radius: 32,
            backgroundColor: AppColors.primaryPink,
            child: Icon(Icons.add, color: Colors.white, size: 28),
          ),
          SizedBox(height: 6),
          Text(
            'Add Pet',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: Colors.black87,
            ),
          ),
        ],
      ),
    );
  }
}

class _ServiceItem extends StatelessWidget {
  final String title;
  final String imagePath;
  final VoidCallback onTap;
  const _ServiceItem({
    required this.title,
    required this.imagePath,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          AspectRatio(
            aspectRatio: 1,
            child: Container(
              decoration: BoxDecoration(
                color: const Color(0xFFEDEFFB),
                borderRadius: BorderRadius.circular(20),
              ),
              padding: const EdgeInsets.all(14),
              child: SvgPicture.asset(
                imagePath,
                fit: BoxFit.contain,
              ),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            title,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: Colors.black,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}
