from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create router for viewsets
router = DefaultRouter()

urlpatterns = [
    # Include router URLs
    path('', include(router.urls)),
    
    # Auth endpoints
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('profile/', views.ProfileView.as_view(), name='profile'),
    path('change-password/', views.ChangePasswordView.as_view(), name='change_password'),
    
    # User verification
    path('verify-email/', views.VerifyEmailView.as_view(), name='verify_email'),
    path('verify-phone/', views.VerifyPhoneView.as_view(), name='verify_phone'),
    path('resend-verification/', views.ResendVerificationView.as_view(), name='resend_verification'),
    path('check-username/', views.CheckUsernameView.as_view(), name='check_username'),
    path('request-verification/', views.RequestVerificationView.as_view(), name='request_verification'),
    
    # Document management
    path('upload-document/', views.UploadDocumentView.as_view(), name='upload_document'),
    path('admin/review-documents/', views.AdminReviewDocumentsView.as_view(), name='admin_review_documents'),
    path('admin/approve-document/<str:user_id>/', views.AdminApproveDocumentView.as_view(), name='admin_approve_document'),
    
    # Admin endpoints
    path('admin/users/', views.AdminUserListView.as_view(), name='admin_user_list'),
    path('admin/create-user/', views.AdminCreateUserView.as_view(), name='admin_create_user'),
    path('admin/upload-document/<str:user_id>/', views.AdminUploadDocumentView.as_view(), name='admin_upload_document'),
    path('admin/toggle-user-status/<str:user_id>/', views.AdminToggleUserStatusView.as_view(), name='admin_toggle_user_status'),
    path('admin/user-details/<str:user_id>/', views.AdminUserDetailView.as_view(), name='admin_user_details'),
    path('admin/update-user/<str:user_id>/', views.AdminUpdateUserView.as_view(), name='admin_update_user'),
    path('admin/reset-password/<str:user_id>/', views.AdminResetPasswordView.as_view(), name='admin_reset_password'),
    path('password-reset/confirm/', views.PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('forgot-password/', views.ForgotPasswordRequestView.as_view(), name='forgot_password'),
    path('admin/change-user-type/<str:user_id>/', views.AdminChangeUserTypeView.as_view(), name='admin_change_user_type'),
    path('admin/reject-document/<str:user_id>/', views.AdminRejectDocumentView.as_view(), name='admin_reject_document'),
    path('admin/download-document/<str:user_id>/', views.AdminDownloadDocumentView.as_view(), name='admin_download_document'),
    path('admin/update-document/<str:user_id>/<str:document_id>/', views.AdminUpdateIdentityDocumentView.as_view(), name='admin_update_document'),
    # Wallet admin actions
    path('admin/wallet-adjust/<str:user_id>/', views.AdminAdjustWalletView.as_view(), name='admin_wallet_adjust'),
    path('admin/wallet-toggle/<str:user_id>/', views.AdminToggleWalletView.as_view(), name='admin_wallet_toggle'),
    # Admin dashboard summary stats
    path('admin/dashboard-stats/', views.AdminDashboardStatsView.as_view(), name='admin_dashboard_stats'),
    # Admin dashboard recent activity
    path('admin/recent-activity/', views.AdminRecentActivityView.as_view(), name='admin_recent_activity'),
]
