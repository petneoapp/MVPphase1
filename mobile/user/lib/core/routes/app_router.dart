import 'package:go_router/go_router.dart';
import '../../features/splash/presentation/pages/splash_page.dart';
import '../../features/onboarding/presentation/pages/onboarding_page.dart';
import '../../features/auth/presentation/pages/welcome_page.dart';
import '../../features/auth/presentation/pages/login_page.dart';
import '../../features/auth/presentation/pages/register_phone_page.dart';
import '../../features/auth/presentation/pages/otp_page.dart';
import '../../features/auth/presentation/pages/personal_details_page.dart';
import '../../features/auth/presentation/pages/pet_details_page.dart';
import '../../features/auth/presentation/pages/registration_success_page.dart';
import '../../features/home/presentation/pages/home_page.dart';
import '../../features/vets/presentation/pages/vets_list_page.dart';
import '../../features/vets/presentation/pages/vet_profile_page.dart';
import '../../features/booking/presentation/pages/booking_page.dart';
import '../../features/booking/presentation/pages/appointment_confirmation_page.dart';
import '../../features/pets/presentation/pages/my_pets_page.dart';
import '../../features/pets/presentation/pages/pet_view_details_page.dart';
import '../../features/pets/presentation/pages/pet_history_page.dart';
import '../../features/pets/presentation/pages/vaccination_records_page.dart';
import '../../features/appointments/presentation/pages/appointment_details_page.dart';
import '../../features/appointments/presentation/pages/appointment_cancelled_page.dart';
import '../../features/appointments/presentation/pages/my_appointments_page.dart';
import '../../features/profile/presentation/pages/profile_page.dart';
import '../../features/profile/presentation/pages/about_page.dart';
import '../../features/profile/presentation/pages/privacy_page.dart';
import '../../features/profile/presentation/pages/help_page.dart';
import '../../features/profile/presentation/pages/my_addresses_page.dart';
import '../../features/community/presentation/pages/community_page.dart';
import '../../features/emergency/presentation/pages/emergency_page.dart';
import '../../features/emergency/presentation/pages/emergency_info_vet_page.dart';
import '../../features/emergency/presentation/pages/emergency_info_clinic_page.dart';
import '../../features/emergency/presentation/pages/emergency_tracking_page.dart';
import '../../features/emergency/presentation/pages/get_directions_page.dart';
import '../../features/shop/presentation/pages/shop_page.dart';
import '../../features/shop/presentation/pages/cart_page.dart';
import '../../features/marketplace/presentation/pages/marketplace_page.dart';
import '../../features/workflows/presentation/pages/workflow_tracking_page.dart';
import '../../features/grooming/presentation/pages/grooming_page.dart';
import '../../features/boarding/presentation/pages/boarding_page.dart';
import '../../features/orders/presentation/pages/orders_page.dart';
import '../../features/orders/presentation/pages/order_details_page.dart';
import '../../features/shop/presentation/pages/checkout_page.dart';
import '../../features/shop/presentation/pages/order_success_page.dart';
import '../../features/shop/data/models/checkout_model.dart';
import '../widgets/main_wrapper.dart';

class AppRouter {
  static final router = GoRouter(
    initialLocation: '/',
    routes: [
      GoRoute(path: '/', builder: (context, state) => const SplashPage()),
      GoRoute(path: '/onboarding', builder: (context, state) => const OnboardingPage()),
      GoRoute(path: '/welcome', builder: (context, state) => const WelcomePage()),
      GoRoute(path: '/login', builder: (context, state) => const LoginPage()),
      GoRoute(path: '/register-phone', builder: (context, state) => const RegisterPhonePage()),
      GoRoute(
        path: '/otp',
        builder: (context, state) {
          final phone = state.extra as String? ?? '';
          return OtpPage(phoneNumber: phone);
        },
      ),
      GoRoute(path: '/personal-details', builder: (context, state) => const PersonalDetailsPage()),
      GoRoute(path: '/pet-details', builder: (context, state) => const PetDetailsPage()),
      GoRoute(path: '/registration-success', builder: (context, state) => const RegistrationSuccessPage()),
      GoRoute(path: '/update-profile', builder: (context, state) => const VetProfilePage()),
      GoRoute(path: '/my-addresses', builder: (context, state) => const MyAddressesPage()),
      GoRoute(path: '/my-pets', builder: (context, state) => const MyPetsPage()),
      GoRoute(
        path: '/pet-view-details',
        builder: (context, state) {
          final id = state.uri.queryParameters['id'] ?? '';
          return PetViewDetailsPage(petId: id);
        },
      ),
      GoRoute(
        path: '/pet-history',
        builder: (context, state) {
          final id = state.uri.queryParameters['id'] ?? '';
          return PetHistoryPage(petId: id);
        },
      ),
      GoRoute(path: '/vaccination-records', builder: (context, state) => const VaccinationRecordsPage()),

      // Shell routes for bottom nav tabs
      ShellRoute(
        builder: (context, state, child) => MainWrapper(child: child),
        routes: [
          GoRoute(path: '/home', builder: (context, state) => const HomePage()),
          GoRoute(path: '/my-appointments', builder: (context, state) => const MyAppointmentsPage()),
          GoRoute(path: '/emergency', builder: (context, state) => const EmergencyPage()),
          GoRoute(path: '/community', builder: (context, state) => const CommunityPage()),
          GoRoute(path: '/profile', builder: (context, state) => const ProfilePage()),
          GoRoute(path: '/about', builder: (context, state) => const AboutPage()),
          GoRoute(path: '/privacy', builder: (context, state) => const PrivacyPage()),
          GoRoute(path: '/help', builder: (context, state) => const HelpPage()),

          GoRoute(
            path: '/appointment-details',
            builder: (context, state) {
              final id = state.uri.queryParameters['id'] ?? '';
              return AppointmentDetailsPage(appointmentId: id);
            },
          ),
          GoRoute(path: '/appointment-cancelled', builder: (context, state) => const AppointmentCancelledPage()),
          GoRoute(
            path: '/vets-list',
            builder: (context, state) {
              final visitType = state.uri.queryParameters['visit_type'] ?? '';
              return VetsListPage(visitType: visitType);
            },
          ),
          GoRoute(path: '/vet-profile/:id', builder: (context, state) => const VetProfilePage()),
          GoRoute(
            path: '/booking',
            builder: (context, state) {
              final vetId = state.uri.queryParameters['vet_id'] ?? '';
              final extra = state.extra is Map<String, dynamic>
                  ? state.extra as Map<String, dynamic>
                  : null;
              return BookingPage(vetId: vetId, vetData: extra);
            },
          ),
          GoRoute(path: '/appointment-confirmation', builder: (context, state) => const AppointmentConfirmationPage()),
          GoRoute(path: '/emergency-info-vet', builder: (context, state) => const EmergencyInfoVetPage()),
          GoRoute(path: '/emergency-info-clinic', builder: (context, state) => const EmergencyInfoClinicPage()),
          GoRoute(path: '/emergency-tracking', builder: (context, state) => const EmergencyTrackingPage()),
          GoRoute(path: '/get-directions', builder: (context, state) => const GetDirectionsPage()),

          // Scaffolded Features
          GoRoute(path: '/shop', builder: (context, state) => const ShopPage()),
          GoRoute(path: '/cart', builder: (context, state) => const CartPage()),
          GoRoute(path: '/checkout', builder: (context, state) => const CheckoutPage()),
          GoRoute(
            path: '/order-success',
            builder: (context, state) {
              final extra = state.extra as OrderConfirmationResponse;
              return OrderSuccessPage(orderData: extra);
            },
          ),
          GoRoute(path: '/marketplace', builder: (context, state) => const MarketplacePage()),
          GoRoute(path: '/grooming', builder: (context, state) => const GroomingPage()),
          GoRoute(path: '/boarding', builder: (context, state) => const BoardingPage()),
          GoRoute(path: '/orders', builder: (context, state) => const OrdersPage()),
          GoRoute(
            path: '/order-details',
            builder: (context, state) {
              final id = state.uri.queryParameters['id'] ?? '';
              return OrderDetailsPage(orderId: id);
            },
          ),
          GoRoute(path: '/my-activity', builder: (context, state) => const WorkflowTrackingPage()),
        ],
      ),
    ],
  );
}
