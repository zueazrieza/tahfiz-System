<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Tahfiz Management System</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" type="image/png" href="{{ asset('images/logo2.png') }}">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        :root {
            --blue: #6FC7CB;
            --blue-dark: #5FB3B7;
            --green: #6FC7CB;
            --green-dark: #5FB3B7;
            --green-light: #D1EEF0;
            --slate-900: #0f172a;
            --slate-800: #1f2937;
            --slate-700: #374151;
            --slate-600: #4b5563;
            --slate-500: #6b7280;
            --slate-400: #9ca3af;
            --slate-100: #e5e7eb;
            --bg-right-from: #e6f7ef;
            --bg-right-to: #c9f0de;
        }

        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            font-family: "Plus Jakarta Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            color: var(--slate-900);
            background: #ffffff;
        }

        a {
            text-decoration: none;
            color: inherit;
        }

        /* NAVBAR */
        .navbar {
            width: 100%;
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(16px);
            border-bottom: 1px solid rgba(226, 232, 240, 0.8);
            position: sticky;
            top: 0;
            z-index: 30;
        }

        .navbar-inner {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 1rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            height: 72px;
        }

        /* Mobile Menu Toggle Button */
        .nav-toggle {
            display: none;
            background: none;
            border: none;
            cursor: pointer;
            padding: 0.5rem;
            z-index: 40;
            outline: none;
        }

        .nav-toggle-icon,
        .nav-toggle-icon::before,
        .nav-toggle-icon::after {
            display: block;
            width: 24px;
            height: 2.5px;
            background: var(--slate-700);
            transition: transform 0.25s ease, opacity 0.25s ease, background-color 0.25s ease;
            position: relative;
            border-radius: 99px;
        }

        .nav-toggle-icon::before,
        .nav-toggle-icon::after {
            content: "";
            position: absolute;
            left: 0;
        }

        .nav-toggle-icon::before {
            top: -7px;
        }

        .nav-toggle-icon::after {
            bottom: -7px;
        }

        /* Toggle Open State Styling */
        .nav-toggle.active .nav-toggle-icon {
            background: transparent;
        }

        .nav-toggle.active .nav-toggle-icon::before {
            transform: translateY(7px) rotate(45deg);
        }

        .nav-toggle.active .nav-toggle-icon::after {
            transform: translateY(-7px) rotate(-45deg);
        }

        .nav-logo {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .nav-logo-icon {
            height: 36px;
            width: 36px;
            border-radius: 14px;
            background: linear-gradient(135deg, #6FC7CB, #6FC7CB);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-weight: 600;
            font-size: 0.8rem;
            box-shadow: 0 8px 24px rgba(37, 99, 235, 0.4);
        }

        .nav-logo-text {
            font-size: 1.1rem;
            font-weight: 600;
            letter-spacing: -0.02em;
        }

        .nav-links {
            display: flex;
            align-items: center;
            gap: 2rem;
            font-size: 0.9rem;
            font-weight: 500;
            color: var(--slate-500);
        }

        .nav-links a {
            transition: color 0.2s ease;
        }
        
        .nav-links a:hover {
            color: var(--blue);
        }

        .nav-links a::after {
            content: "";
            position: absolute;
            left: 0;
            right: 0;
            bottom: -4px;
            height: 2px;
            border-radius: 999px;
            background: var(--blue);
            transform: scaleX(0);
            transform-origin: center;
            transition: transform 0.2s ease;
        }

        .nav-links a:hover {
            color: var(--blue);
        }

        .nav-links a:hover::after {
            transform: scaleX(1);
        }

        .nav-actions {
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }

        .btn-login {
            padding: 0.4rem 1.15rem;
            border-radius: 999px;
            background: var(--green-light);
            color: #166534;
            font-size: 0.85rem;
            font-weight: 500;
            border: none;
            cursor: pointer;
            transition: background 0.18s ease, transform 0.18s ease;
        }

        .btn-login:hover {
            background: #a7f3c7;
            transform: translateY(-1px);
        }

        .btn-signup {
            padding: 0.45rem 1.2rem;
            border-radius: 999px;
            background: var(--green);
            color: #ffffff;
            font-size: 0.9rem;
            font-weight: 600;
            border: none;
            cursor: pointer;
            box-shadow: 0 10px 24px rgba(22, 163, 74, 0.3);
            transition: background 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease;
        }

        .btn-signup:hover {
            background: var(--green-dark);
            transform: translateY(-1px);
            box-shadow: 0 14px 32px rgba(22, 163, 74, 0.35);
        }

        /* HERO LAYOUT */
        .hero {
            position: relative;
            overflow: hidden;
            background: #ffffff;
        }

        .hero-inner {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2.5rem 1rem 4rem;
            display: grid;
            grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
            gap: 3rem;
            align-items: center;
            position: relative;
            z-index: 1;
        }

        .hero-left {
            max-width: 580px;
        }

        .hero-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
            padding: 0.25rem 0.8rem;
            border-radius: 999px;
            background: rgba(37, 99, 235, 0.06);
            border: 1px solid rgba(37, 99, 235, 0.2);
        }

        .hero-badge-dot {
            width: 6px;
            height: 6px;
            border-radius: 999px;
            background: var(--blue);
        }

        .hero-badge-text {
            font-size: 0.7rem;
            text-transform: uppercase;
            letter-spacing: 0.14em;
            font-weight: 600;
            color: var(--blue);
        }

        .hero-title {
            margin: 1rem 0 0.75rem;
            font-size: 2.5rem;
            line-height: 1.1;
            font-weight: 800;
            color: var(--green);
            letter-spacing: -0.03em;
        }

        .hero-subtitle {
            font-size: 1rem;
            line-height: 1.7;
            color: var(--slate-600);
            max-width: 520px;
        }

        .hero-features {
            margin-top: 0.75rem;
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
        }

        .feature-item {
            display: flex;
            align-items: flex-start;
            gap: 0.75rem;
        }

        .feature-icon {
            margin-top: 2px;
            height: 32px;
            width: 32px;
            border-radius: 12px;
            background: var(--blue);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            box-shadow: 0 10px 24px rgba(37, 99, 235, 0.35);
        }

        .feature-text {
            font-size: 0.95rem;
            font-weight: 500;
            color: var(--slate-800);
        }

        .hero-cta {
            margin-top: 1.4rem;
            display: flex;
            flex-wrap: wrap;
            gap: 0.7rem;
        }

        .btn-primary {
            padding: 0.7rem 1.6rem;
            border-radius: 999px;
            border: none;
            background: var(--blue);
            color: #ffffff;
            font-size: 0.95rem;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 10px 24px rgba(37, 99, 235, 0.35);
            transition: background 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease;
        }

        .btn-primary:hover {
            background: var(--blue-dark);
            transform: translateY(-1px);
            box-shadow: 0 14px 32px rgba(37, 99, 235, 0.4);
        }

        .btn-secondary {
            padding: 0.7rem 1.6rem;
            border-radius: 999px;
            border: 1.5px solid var(--blue);
            background: #ffffff;
            color: var(--blue);
            font-size: 0.95rem;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.18s ease, color 0.18s ease;
        }

        .btn-secondary:hover {
            background: rgba(37, 99, 235, 0.04);
        }

        /* RIGHT VISUAL AREA */
        .hero-right {
            position: relative;
            height: 380px;
        }

        .hero-right-bg {
            position: absolute;
            inset: 0;
            right: -10px;
            border-radius: 40px;
            background: linear-gradient(145deg, var(--bg-right-from), var(--bg-right-to));
        }

        .hero-right-blob1,
        .hero-right-blob2 {
            position: absolute;
            border-radius: 999px;
            filter: blur(40px);
            pointer-events: none;
        }

        .hero-right-blob1 {
            right: -40px;
            top: -30px;
            width: 210px;
            height: 210px;
            background: rgba(74, 222, 128, 0.5);
        }

        .hero-right-blob2 {
            left: -30px;
            bottom: 0;
            width: 180px;
            height: 180px;
            background: rgba(45, 212, 191, 0.6);
        }

        .hero-main-image-wrap {
            position: absolute;
            left: 24px;
            right: 12px;
            top: 24px;
            bottom: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .hero-main-image-inner {
            position: relative;
            max-width: 260px;
            width: 100%;
        }

        .hero-main-image-glow {
            position: absolute;
            inset: -16px;
            border-radius: 32px;
            background: conic-gradient(
                from 220deg,
                rgba(22, 163, 74, 0.15),
                rgba(37, 99, 235, 0.12),
                rgba(16, 185, 129, 0.2)
            );
            filter: blur(18px);
        }

        .hero-main-image-card {
            position: relative;
            border-radius: 28px;
            overflow: hidden;
            background: rgba(15, 23, 42, 0.92);
            border: 1px solid rgba(15, 23, 42, 0.8);
            box-shadow: 0 26px 64px rgba(15, 23, 42, 0.8);
        }

        .hero-main-image-placeholder {
            height: 260px;
            background:
                radial-gradient(circle at top, #4ade80 0, #0369a1 60%, #020617 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            color: #e5e7eb;
            padding: 1.2rem;
        }

        .hero-main-image-placeholder-title {
            margin-bottom: 0.4rem;
            font-size: 0.7rem;
            text-transform: uppercase;
            letter-spacing: 0.2em;
            color: rgba(190, 242, 100, 0.8);
        }

        .hero-main-image-placeholder-text {
            font-size: 0.95rem;
            font-weight: 600;
        }

        .hero-main-image-placeholder-highlight {
            color: #6ee7b7;
        }

        /* Glass widgets */
        .widget {
            position: absolute;
            border-radius: 18px;
            background: rgba(255, 255, 255, 0.9);
            border: 1px solid rgba(148, 163, 184, 0.25);
            box-shadow: 0 18px 45px rgba(15, 23, 42, 0.18);
            backdrop-filter: blur(18px);
            padding: 0.8rem;
            font-size: 0.7rem;
        }

        .widget-1 {
            top: -10px;
            left: 0;
            width: 210px;
            animation: float1 7s ease-in-out infinite;
        }

        .widget-2 {
            bottom: 10px;
            left: 8px;
            width: 210px;
            animation: float2 8.5s ease-in-out infinite;
        }

        .widget-3 {
            top: 70px;
            right: 0;
            width: 220px;
            animation: float3 9s ease-in-out infinite;
        }

        .widget-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 0.35rem;
        }

        .widget-title {
            font-weight: 600;
            font-size: 0.7rem;
            color: var(--slate-800);
        }

        .widget-chip {
            display: inline-flex;
            align-items: center;
            gap: 0.15rem;
            padding: 0.15rem 0.45rem;
            border-radius: 999px;
            background: #ecfdf5;
            color: #166534;
            font-size: 0.6rem;
            font-weight: 600;
        }

        .widget-chip-dot {
            width: 6px;
            height: 6px;
            border-radius: 999px;
            background: #6FC7CB;
        }

        .widget-subtext {
            font-size: 0.65rem;
            color: var(--slate-400);
            margin-bottom: 0.35rem;
        }

        .widget-bars {
            display: flex;
            align-items: flex-end;
            gap: 0.25rem;
            height: 56px;
        }

        .widget-bar-outer {
            flex: 1;
            border-radius: 999px;
            background: #dbeafe;
            overflow: hidden;
        }

        .widget-bar-inner {
            width: 100%;
            border-radius: 999px;
            background: var(--blue);
        }

        .widget2-row {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 0.3rem;
        }

        .widget2-avatar {
            height: 28px;
            width: 28px;
            border-radius: 999px;
            background: #dbeafe;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.65rem;
            font-weight: 600;
            color: var(--blue);
        }

        .widget2-name {
            font-size: 0.7rem;
            font-weight: 600;
            color: var(--slate-800);
        }

        .widget2-meta {
            font-size: 0.65rem;
            color: var(--slate-400);
        }

        .widget2-pill {
            display: inline-flex;
            align-items: center;
            gap: 0.25rem;
            padding: 0.15rem 0.4rem;
            border-radius: 999px;
            background: #ecfdf5;
            color: #166534;
            font-size: 0.65rem;
            font-weight: 500;
            margin-bottom: 0.25rem;
        }

        .widget-timestamp {
            font-size: 0.6rem;
            color: var(--slate-400);
        }

        .widget3-amount {
            font-size: 0.8rem;
            font-weight: 600;
            color: var(--slate-900);
        }

        .widget3-label {
            font-size: 0.7rem;
            font-weight: 500;
            color: var(--slate-700);
        }

        .widget3-meta {
            font-size: 0.6rem;
            color: var(--slate-400);
            margin-top: 0.1rem;
        }

        .icon-line {
            width: 12px;
            height: 12px;
            border-radius: 3px;
            border: 2px solid rgba(255, 255, 255, 0.9);
            border-bottom: none;
            border-right: none;
            transform: rotate(-45deg);
        }

        @keyframes float1 {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-6px); }
        }
        @keyframes float2 {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
        }
        @keyframes float3 {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-7px); }
        }

        @media (max-width: 960px) {
            .navbar-inner {
                height: 64px;
            }
            .nav-links {
                display: none;
            }
            .nav-actions {
                display: none;
            }
            .hero-inner {
                grid-template-columns: minmax(0, 1fr);
                padding-top: 2rem;
                padding-bottom: 3rem;
            }
            .hero-right {
                margin-top: 1.5rem;
                height: 360px;
            }
            .hero-title {
                font-size: 2.2rem;
            }
        }

        /* AUTH CARD BELOW HERO */
        .auth-section {
            max-width: 1200px;
            margin: 0 auto 4rem;
            padding: 0 1rem;
        }

        .auth-card {
            margin-top: 2rem;
            border-radius: 32px;
            background: #ffffff;
            box-shadow: 0 24px 60px rgba(15, 23, 42, 0.10);
            display: grid;
            grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
            overflow: hidden;
        }

        .auth-card-left {
            padding: 2.5rem;
        }

        .auth-tabs {
            display: inline-flex;
            padding: 0.25rem;
            border-radius: 999px;
            background: #f1f5f9;
            margin-bottom: 1.5rem;
        }

        .auth-tab {
            border: none;
            background: transparent;
            padding: 0.5rem 1.2rem;
            border-radius: 999px;
            font-size: 0.85rem;
            font-weight: 600;
            color: var(--slate-500);
            cursor: pointer;
        }

        .auth-tab.active {
            background: #ffffff;
            color: var(--blue);
            box-shadow: 0 10px 25px rgba(15, 23, 42, 0.06);
        }

        .auth-title {
            font-size: 1.4rem;
            font-weight: 700;
            color: var(--slate-900);
            margin-bottom: 0.25rem;
        }

        .auth-subtitle {
            font-size: 0.9rem;
            color: var(--slate-500);
            margin-bottom: 1.5rem;
        }

        .auth-form {
            display: none;
        }

        .auth-form.active {
            display: block;
        }

        .form-grid {
            display: flex;
            flex-direction: column;
            gap: 0.9rem;
        }

        .form-label {
            font-size: 0.8rem;
            font-weight: 600;
            color: var(--slate-700);
            margin-bottom: 0.25rem;
        }

        .form-input,
        .form-select {
            width: 100%;
            padding: 0.75rem 0.9rem;
            border-radius: 0.9rem;
            border: 1px solid var(--slate-100);
            background: #f9fafb;
            font-size: 0.9rem;
            outline: none;
            transition: border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;
        }

        .form-input:focus,
        .form-select:focus {
            border-color: var(--blue);
            box-shadow: 0 0 0 1px rgba(37, 99, 235, 0.2);
            background: #ffffff;
        }

        .role-options {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 0.6rem;
            margin-bottom: 0.5rem;
        }

        .role-label {
            display: flex;
            align-items: center;
            padding: 0.7rem 0.8rem;
            border-radius: 0.9rem;
            background: #e2f3f2;
            border: 1px solid transparent;
            cursor: pointer;
            transition: background 0.15s ease, border-color 0.15s ease, transform 0.12s ease;
            font-size: 0.8rem;
        }

        .role-label span {
            margin-left: 0.4rem;
            color: #1f2937;
            font-weight: 500;
        }

        .role-radio {
            display: none;
        }

        .role-radio:checked + .role-label {
            background: #8dafb0;
            border-color: #ffffff;
            transform: translateY(-1px);
        }

        .auth-footer-text {
            margin-top: 1rem;
            font-size: 0.8rem;
            color: var(--slate-500);
            text-align: center;
        }

        .auth-footer-text a {
            color: var(--blue);
            font-weight: 600;
        }

        .auth-error {
            margin-top: 0.75rem;
            font-size: 0.8rem;
            color: #dc2626;
        }

        .auth-card-right {
            padding: 2.5rem;
            background: radial-gradient(circle at top left, #D1EEF0, #6FC7CB 40%, #5FB3B7 100%);
            color: #ecfdf5;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }

        .auth-right-title {
            font-size: 1.6rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
        }

        .auth-right-text {
            font-size: 0.9rem;
            opacity: 0.9;
            margin-bottom: 1.2rem;
        }

        .auth-right-bullets {
            font-size: 0.85rem;
            list-style: none;
            padding-left: 0;
            margin: 0;
        }

        .auth-right-bullets li {
            display: flex;
            align-items: center;
            gap: 0.4rem;
            margin-bottom: 0.35rem;
        }

        .auth-right-bullets span {
            width: 18px;
            height: 18px;
            border-radius: 999px;
            border: 2px solid rgba(240, 253, 250, 0.7);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 0.65rem;
        }

        @media (max-width: 960px) {
            .navbar-inner {
                height: 64px;
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                justify-content: space-between;
            }
            .nav-toggle {
                display: block;
            }
            .nav-links {
                display: none;
                flex-direction: column;
                width: 100%;
                gap: 1.25rem;
                padding: 1.25rem 0;
                border-top: 1px solid #e2e8f0;
                margin-top: 0.5rem;
            }
            .nav-actions {
                display: none;
                flex-direction: column;
                width: 100%;
                gap: 0.75rem;
                padding-bottom: 1.25rem;
            }
            .btn-login,
            .btn-signup {
                width: 100%;
                text-align: center;
                padding: 0.75rem;
            }
            
            /* Show when navbar is active */
            .navbar.active .navbar-inner {
                height: auto;
            }
            .navbar.active .nav-links {
                display: flex;
            }
            .navbar.active .nav-actions {
                display: flex;
            }
            .hero-inner {
                grid-template-columns: minmax(0, 1fr);
                padding-top: 2rem;
                padding-bottom: 3rem;
            }
            .hero-right {
                margin-top: 1.5rem;
                height: 360px;
            }
            .hero-title {
                font-size: 2.2rem;
            }
            .auth-card {
                grid-template-columns: minmax(0, 1fr);
            }
            .auth-card-right {
                display: none;
            }
        }

        @media (max-width: 640px) {
            .hero-inner {
                padding-inline: 1rem;
            }
            .hero-title {
                font-size: 1.9rem;
            }
            .hero-subtitle {
                font-size: 0.95rem;
            }
            .hero-right {
                height: 340px;
            }
            .widget-1,
            .widget-2,
            .widget-3 {
                transform: scale(0.9);
            }
        }
        /* Carousel Styles */
        .media-carousel {
            position: relative;
            max-width: 1000px;
            margin: 0 auto;
            border-radius: 32px;
            overflow: hidden;
            box-shadow: 0 25px 60px rgba(0,0,0,0.15);
            background: #fff;
            border: 8px solid #fff;
        }
        .carousel-track-container {
            position: relative;
            height: 0;
            padding-bottom: 56.25%; /* 16:9 Aspect Ratio */
            overflow: hidden;
        }
        .carousel-track {
            display: flex;
            position: absolute;
            top: 0;
            left: 0;
            width: 300%; /* 3 items */
            height: 100%;
            transition: transform 0.5s ease-in-out;
        }
        .carousel-slide {
            width: 33.333%;
            height: 100%;
            flex-shrink: 0;
        }
        .carousel-slide img, .carousel-slide iframe {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border: none;
        }
        .carousel-btn {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            background: rgba(255,255,255,0.9);
            color: #6FC7CB;
            border: none;
            width: 45px;
            height: 45px;
            border-radius: 50%;
            cursor: pointer;
            z-index: 10;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.25rem;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            transition: all 0.2s;
        }
        .carousel-btn:hover { background: #fff; transform: translateY(-50%) scale(1.1); color: #5FB3B7; }
        .carousel-btn-prev { left: 20px; }
        .carousel-btn-next { right: 20px; }
        
        .carousel-dots {
            position: absolute;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 10px;
            z-index: 10;
        }
        .carousel-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: rgba(255,255,255,0.5);
            cursor: pointer;
            border: none;
        }
        .carousel-dot.active { background: #fff; width: 25px; border-radius: 999px; }
    </style>
</head>
<body>
    <!-- NAVBAR -->
    <header class="navbar">
        <div class="navbar-inner">
            <div class="nav-logo">
                <img src="/images/logo.png" alt="AKMAL Logo" style="height: 52px; filter: drop-shadow(0 4px 8px rgba(111,199,203,0.3));">
            </div>

            <!-- Mobile Menu Toggle Button -->
            <button class="nav-toggle" id="navToggle" aria-label="Toggle navigation">
                <span class="nav-toggle-icon"></span>
            </button>

            <nav class="nav-links">
                <a href="#home">Home</a>
                <a href="#metodologi">Metodologi</a>
                <a href="#testimoni">Testimoni</a>
                <a href="#online-programs">Program</a>
                <a href="#locations">Lokasi</a>
                <a href="#contact">Hubungi</a>
            </nav>

            <div class="nav-actions">
                <a href="/app/role-selection" class="btn-login">Login</a>
                <a href="/app/register/students" class="btn-signup">Daftar Sekarang</a>
            </div>
        </div>
    </header>

    <!-- HERO -->
    <section id="home" class="hero">
        <div class="hero-inner">
            <!-- LEFT -->
            <div class="hero-left">
                <div class="hero-badge">
                    <span class="hero-badge-dot"></span>
                    <span class="hero-badge-text">Powered by Modern Tech</span>
                </div>

                <h1 class="hero-title" style="color: #5FB3B7;">Setahun Menempa Sejarah: Misi Hafiz 30 Juzuk Al-Quran</h1>

                <p class="hero-subtitle">
                    Fokus mencapai misi hafiz 30 juzuk Al-Quran dalam tempoh setahun insyaAllah. Jom jadi sebahagian sejarah hafiz/ah khatam Al-Quran bersama kami.
                </p>

                <div class="hero-features" id="hero-features">
                    <div class="feature-item">
                        <div class="feature-icon" style="background: #D1EEF0; border-radius: 50%; padding: 5px;">✅</div>
                        <div class="feature-text">Modul Menarik & Mudah</div>
                    </div>

                    <div class="feature-item">
                        <div class="feature-icon" style="background: #D1EEF0; border-radius: 50%; padding: 5px;">✅</div>
                        <div class="feature-text">Pengurusan Masa Sistematik</div>
                    </div>

                    <div class="feature-item">
                        <div class="feature-icon" style="background: #D1EEF0; border-radius: 50%; padding: 5px;">✅</div>
                        <div class="feature-text">Pemantapan 6 Rukun Hafiz</div>
                    </div>
                </div>

                <div class="hero-cta">
                    <a href="/app/register/students" class="btn-primary" style="text-decoration:none; display:inline-block;">DAFTAR SEKARANG</a>
                    <a href="#testimonials" class="btn-secondary" style="text-decoration:none; display:inline-block;">TESTIMONI</a>
                </div>
            </div>

            <!-- RIGHT -->
            <div class="hero-right">
                <div class="hero-right-bg"></div>
                <div class="hero-right-blob1"></div>
                <div class="hero-right-blob2"></div>

                <div class="hero-main-image-wrap">
                    <div class="hero-main-image-inner">
                        <div class="hero-main-image-glow"></div>
                        <div class="hero-main-image-card">
                            <!-- Replace this block with a real tahfiz-related photo -->
                            <div class="hero-main-image-placeholder">
                                <img src="/images/logo.png" alt="Akmal Logo" style="width: 85%; height: auto; filter: drop-shadow(0 0 15px rgba(111,199,203,0.4));">
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Widget 1: Memorization Progress -->
                <div class="widget widget-1">
                    <div class="widget-header">
                        <span class="widget-title">Memorization Progress</span>
                        <span class="widget-chip">82%</span>
                    </div>
                    <div class="widget-subtext">Class 5A • This week</div>
                    <div class="widget-bars">
                        <div class="widget-bar-outer">
                            <div class="widget-bar-inner" style="height:40%;"></div>
                        </div>
                        <div class="widget-bar-outer">
                            <div class="widget-bar-inner" style="height:50%;"></div>
                        </div>
                        <div class="widget-bar-outer">
                            <div class="widget-bar-inner" style="height:75%;"></div>
                        </div>
                        <div class="widget-bar-outer">
                            <div class="widget-bar-inner" style="height:85%;"></div>
                        </div>
                        <div class="widget-bar-outer">
                            <div class="widget-bar-inner" style="height:95%; background:#5FB3B7;"></div>
                        </div>
                    </div>
                </div>

                <!-- Widget 2: Attendance -->
                <div class="widget widget-2">
                    <div class="widget2-row">
                        <div class="widget2-avatar">AZ</div>
                        <div>
                            <div class="widget2-name">Ahmad Zulkifli</div>
                            <div class="widget2-meta">Tahfiz Junior • 5A</div>
                        </div>
                    </div>
                    <div class="widget2-pill">
                        <span style="width:10px;height:10px;border-radius:999px;border:2px solid #6FC7CB;border-top:none;border-left:none;transform:rotate(45deg);display:inline-block;"></span>
                        Attendance Marked
                    </div>
                    <div class="widget-timestamp">Today • 07:45 AM</div>
                </div>

                <!-- Widget 3: Yuran Dibayar -->
                <div class="widget widget-3">
                    <div class="widget-header">
                        <span class="widget-title">Yuran Dibayar</span>
                        <span class="widget-chip">
                            <span class="widget-chip-dot"></span>
                            Paid
                        </span>
                    </div>
                    <div>
                        <div class="widget3-label">Nur Aisyah</div>
                        <div class="widget3-amount">RM 150.00</div>
                        <div class="widget3-meta">February • 2026 • Monthly Fee</div>
                    </div>
                </div>
            </div>
        </div>
    </section>
    
    <!-- STATS COUNTER SECTION -->
    <section style="background: #00a693; padding: 4rem 1rem; position: relative; overflow: hidden; border-bottom: 1px solid rgba(255,255,255,0.1);">
        <div style="max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 1.25rem;">
            
            <div style="background: #0b5b54; padding: 2rem 1rem; border-radius: 24px; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.15); border: 1px solid rgba(255,255,255,0.05); transition: all 0.3s ease;" onmouseenter="this.style.transform='translateY(-8px)'; this.style.backgroundColor='#0e6e65';" onmouseleave="this.style.transform='translateY(0)'; this.style.backgroundColor='#0b5b54';">
                <div style="font-size: 2.5rem; font-weight: 800; color: #ffffff; letter-spacing: -0.03em; margin-bottom: 0.25rem;">2018</div>
                <div style="font-size: 0.8rem; font-weight: 700; color: #a7f3d0; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.9;">Ditubuhkan</div>
            </div>

            <div style="background: #0b5b54; padding: 2rem 1rem; border-radius: 24px; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.15); border: 1px solid rgba(255,255,255,0.05); transition: all 0.3s ease;" onmouseenter="this.style.transform='translateY(-8px)'; this.style.backgroundColor='#0e6e65';" onmouseleave="this.style.transform='translateY(0)'; this.style.backgroundColor='#0b5b54';">
                <div style="font-size: 2.5rem; font-weight: 800; color: #ffffff; letter-spacing: -0.03em; margin-bottom: 0.25rem;">10</div>
                <div style="font-size: 0.8rem; font-weight: 700; color: #a7f3d0; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.9;">Cawangan</div>
            </div>

            <div style="background: #0b5b54; padding: 2rem 1rem; border-radius: 24px; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.15); border: 1px solid rgba(255,255,255,0.05); transition: all 0.3s ease;" onmouseenter="this.style.transform='translateY(-8px)'; this.style.backgroundColor='#0e6e65';" onmouseleave="this.style.transform='translateY(0)'; this.style.backgroundColor='#0b5b54';">
                <div style="font-size: 2.5rem; font-weight: 800; color: #ffffff; letter-spacing: -0.03em; margin-bottom: 0.25rem;">20</div>
                <div style="font-size: 0.8rem; font-weight: 700; color: #a7f3d0; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.9;">bakal dibuka</div>
            </div>

            <div style="background: #0b5b54; padding: 2rem 1rem; border-radius: 24px; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.15); border: 1px solid rgba(255,255,255,0.05); transition: all 0.3s ease;" onmouseenter="this.style.transform='translateY(-8px)'; this.style.backgroundColor='#0e6e65';" onmouseleave="this.style.transform='translateY(0)'; this.style.backgroundColor='#0b5b54';">
                <div style="font-size: 2.5rem; font-weight: 800; color: #ffffff; letter-spacing: -0.03em; margin-bottom: 0.25rem;">564</div>
                <div style="font-size: 0.8rem; font-weight: 700; color: #a7f3d0; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.9;">Al-Hafiz</div>
            </div>

            <div style="background: #0b5b54; padding: 2rem 1rem; border-radius: 24px; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.15); border: 1px solid rgba(255,255,255,0.05); transition: all 0.3s ease;" onmouseenter="this.style.transform='translateY(-8px)'; this.style.backgroundColor='#0e6e65';" onmouseleave="this.style.transform='translateY(0)'; this.style.backgroundColor='#0b5b54';">
                <div style="font-size: 2.5rem; font-weight: 800; color: #ffffff; letter-spacing: -0.03em; margin-bottom: 0.25rem;">36</div>
                <div style="font-size: 0.8rem; font-weight: 700; color: #a7f3d0; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.9;">Syahadah</div>
            </div>

            <div style="background: #0b5b54; padding: 2rem 1rem; border-radius: 24px; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.15); border: 1px solid rgba(255,255,255,0.05); transition: all 0.3s ease;" onmouseenter="this.style.transform='translateY(-8px)'; this.style.backgroundColor='#0e6e65';" onmouseleave="this.style.transform='translateY(0)'; this.style.backgroundColor='#0b5b54';">
                <div style="font-size: 2.5rem; font-weight: 800; color: #ffffff; letter-spacing: -0.03em; margin-bottom: 0.25rem;">637</div>
                <div style="font-size: 0.8rem; font-weight: 700; color: #a7f3d0; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.9;">Pelajar</div>
            </div>
        </div>
    </section>

    <!-- METHODOLOGY SECTION -->
    <section id="metodologi" style="padding: 5rem 1rem; background: #f8fafc;">
        <div style="max-width: 1200px; margin: 0 auto;">

            <div style="text-align: center; margin-bottom: 3.5rem;">
                <span style="display: inline-block; background: rgba(111,199,203,0.12); border: 1px solid rgba(111,199,203,0.3); color: #6FC7CB; font-size: 0.72rem; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; padding: 0.3rem 1rem; border-radius: 999px; margin-bottom: 1rem;">Kaedah Terbukti</span>
                <h2 style="font-size: 2.2rem; font-weight: 800; color: #0f172a; margin: 0 0 0.75rem; letter-spacing: -0.02em;">Metodologi 3-Tunjang AKMAL</h2>
                <p style="color: #64748b; max-width: 480px; margin: 0 auto; font-size: 0.95rem; line-height: 1.7;">Setiap sesi hafazan mengikut sistem 3 tunjang yang telah terbukti berkesan selama lebih 10 tahun.</p>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin-bottom: 3rem;">

                <!-- Sabaq -->
                <div style="background: #ffffff; border-radius: 24px; padding: 2rem; border: 1px solid #e2e8f0; position: relative; overflow: hidden;" onmouseenter="this.style.boxShadow='0 16px 40px rgba(15,23,42,0.08)'" onmouseleave="this.style.boxShadow='none'">
                    <div style="position: absolute; top: 0; left: 0; width: 4px; height: 100%; background: #6FC7CB; border-radius: 4px 0 0 4px;"></div>
                    <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.25rem;">
                        <div style="width: 44px; height: 44px; background: #D1EEF0; border-radius: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A4D50" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                        </div>
                        <span style="font-size: 0.7rem; font-weight: 700; color: #6FC7CB; letter-spacing: 0.12em; text-transform: uppercase;">Tunjang 01</span>
                    </div>
                    <h3 style="font-size: 1.3rem; font-weight: 800; color: #0f172a; margin: 0 0 0.6rem; letter-spacing: -0.02em;">Sabaq</h3>
                    <p style="color: #64748b; font-size: 0.88rem; line-height: 1.75; margin: 0;">Hafazan baharu setiap hari bersama murabbi berpengalaman. Target minimum 1 muka surat sehari untuk mencapai 30 juzuk dalam setahun.</p>
                </div>

                <!-- Sabaqi -->
                <div style="background: #ffffff; border-radius: 24px; padding: 2rem; border: 1px solid #e2e8f0; position: relative; overflow: hidden;" onmouseenter="this.style.boxShadow='0 16px 40px rgba(15,23,42,0.08)'" onmouseleave="this.style.boxShadow='none'">
                    <div style="position: absolute; top: 0; left: 0; width: 4px; height: 100%; background: #6FC7CB; border-radius: 4px 0 0 4px;"></div>
                    <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.25rem;">
                        <div style="width: 44px; height: 44px; background: #D1EEF0; border-radius: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A4D50" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg>
                        </div>
                        <span style="font-size: 0.7rem; font-weight: 700; color: #6FC7CB; letter-spacing: 0.12em; text-transform: uppercase;">Tunjang 02</span>
                    </div>
                    <h3 style="font-size: 1.3rem; font-weight: 800; color: #0f172a; margin: 0 0 0.6rem; letter-spacing: -0.02em;">Sabaqi</h3>
                    <p style="color: #64748b; font-size: 0.88rem; line-height: 1.75; margin: 0;">Ulangan hafazan dari sesi semalam untuk mengukuhkan ingatan jangka pendek. Memastikan setiap ayat yang baru dihafaz tidak mudah terlupa.</p>
                </div>

                <!-- Manzil -->
                <div style="background: #ffffff; border-radius: 24px; padding: 2rem; border: 1px solid #e2e8f0; position: relative; overflow: hidden;" onmouseenter="this.style.boxShadow='0 16px 40px rgba(15,23,42,0.08)'" onmouseleave="this.style.boxShadow='none'">
                    <div style="position: absolute; top: 0; left: 0; width: 4px; height: 100%; background: #6FC7CB; border-radius: 4px 0 0 4px;"></div>
                    <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.25rem;">
                        <div style="width: 44px; height: 44px; background: #D1EEF0; border-radius: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A4D50" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                        </div>
                        <span style="font-size: 0.7rem; font-weight: 700; color: #6FC7CB; letter-spacing: 0.12em; text-transform: uppercase;">Tunjang 03</span>
                    </div>
                    <h3 style="font-size: 1.3rem; font-weight: 800; color: #0f172a; margin: 0 0 0.6rem; letter-spacing: -0.02em;">Manzil</h3>
                    <p style="color: #64748b; font-size: 0.88rem; line-height: 1.75; margin: 0;">Muraja'ah hafazan lama secara berkala untuk memastikan hafazan kekal kukuh selamanya. Proses pemantapan yang berterusan sehingga khatam.</p>
                </div>

            </div>

            <!-- Achievement bar — same style as stats section -->
            <div style="background: #0b5b54; border-radius: 24px; padding: 2rem 2.5rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 1.5rem;">
                <div style="text-align: center;">
                    <div style="font-size: 2.2rem; font-weight: 800; color: #ffffff; letter-spacing: -0.03em; margin-bottom: 0.2rem;">3</div>
                    <div style="font-size: 0.72rem; font-weight: 700; color: #a7f3d0; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.2rem;">Bulan Terpantas</div>
                    <div style="font-size: 0.82rem; color: rgba(255,255,255,0.6);">Rekod khatam 30 juzuk</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 2.2rem; font-weight: 800; color: #ffffff; letter-spacing: -0.03em; margin-bottom: 0.2rem;">7–11</div>
                    <div style="font-size: 0.72rem; font-weight: 700; color: #a7f3d0; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.2rem;">Bulan Purata</div>
                    <div style="font-size: 0.82rem; color: rgba(255,255,255,0.6);">Tempoh khatam pelajar biasa</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 2.2rem; font-weight: 800; color: #ffffff; letter-spacing: -0.03em; margin-bottom: 0.2rem;">10+</div>
                    <div style="font-size: 0.72rem; font-weight: 700; color: #a7f3d0; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.2rem;">Tahun Minimum</div>
                    <div style="font-size: 0.82rem; color: rgba(255,255,255,0.6);">Tiada had umur atas</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 2.2rem; font-weight: 800; color: #ffffff; letter-spacing: -0.03em; margin-bottom: 0.2rem;">564+</div>
                    <div style="font-size: 0.72rem; font-weight: 700; color: #a7f3d0; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.2rem;">Al-Hafiz Dilahirkan</div>
                    <div style="font-size: 0.82rem; color: rgba(255,255,255,0.6);">Sejak 2018 hingga kini</div>
                </div>
            </div>

        </div>
    </section>

    <!-- MEDIA VIDEO SECTION -->
    <section id="media" style="padding: 6rem 1rem; background: linear-gradient(135deg, #f8fafc 0%, #e8f4f5 100%);">
        <div style="max-width: 1000px; margin: 0 auto; text-align: center;">
            <p style="text-transform: uppercase; letter-spacing: 0.1em; color: #6FC7CB; font-weight: 700; margin-bottom: 0.5rem;">Visi & Misi Kami</p>
            <h2 style="font-size: 2.2rem; font-weight: 800; color: #5FB3B7; margin-bottom: 3rem;">Tujuan & Matlamat Utama AKMAL</h2>
            
            <div style="margin-bottom: 5rem; border-radius: 24px; overflow: hidden; box-shadow: 0 15px 45px rgba(0,0,0,0.08); border: 2px solid #fff;">
                <img src="/images/visi_misi.png" alt="AKMAL Visi & Misi" style="width: 100%; height: auto; display: block;">
            </div>

            <p style="text-transform: uppercase; letter-spacing: 0.1em; color: #6FC7CB; font-weight: 700; margin-bottom: 0.5rem;">Informasi Media</p>
            <h2 style="font-size: 2.2rem; font-weight: 800; color: #5FB3B7; margin-bottom: 3rem;">Terokai Program & Aktiviti Kami</h2>
            
            <div class="media-carousel">
                <div class="carousel-track-container">
                    <div class="carousel-track" id="carouselTrack">
                        <!-- Slide 1: Image -->
                        <div class="carousel-slide">
                            <img src="/images/info1.png" alt="Info 1">
                        </div>
                        <!-- Slide 2: Video 1 -->
                        <div class="carousel-slide">
                            <iframe src="https://www.youtube.com/embed/lCRIwE8jg0s?enablejsapi=1" title="AKMAL Clip 1" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                        </div>
                        <!-- Slide 3: Video 2 -->
                        <div class="carousel-slide">
                            <iframe src="https://www.youtube.com/embed/Vmf2GWXglZc?enablejsapi=1" title="AKMAL Clip 2" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                        </div>
                    </div>
                </div>
                
                <button class="carousel-btn carousel-btn-prev" onclick="moveSlide(-1)">❮</button>
                <button class="carousel-btn carousel-btn-next" onclick="moveSlide(1)">❯</button>
                
                <div class="carousel-dots">
                    <button class="carousel-dot active" onclick="currentSlide(0)"></button>
                    <button class="carousel-dot" onclick="currentSlide(1)"></button>
                    <button class="carousel-dot" onclick="currentSlide(2)"></button>
                </div>
            </div>
            
            <script>
                let currentIdx = 0;
                const track = document.getElementById('carouselTrack');
                const dots = document.querySelectorAll('.carousel-dot');
                
                function updateCarousel() {
                    track.style.transform = `translateX(-${currentIdx * 33.333}%)`;
                    dots.forEach((dot, i) => {
                        dot.classList.toggle('active', i === currentIdx);
                    });
                }
                
                function moveSlide(dir) {
                    currentIdx = (currentIdx + dir + 3) % 3;
                    updateCarousel();
                }
                
                function currentSlide(idx) {
                    currentIdx = idx;
                    updateCarousel();
                }
            </script>
            
            <p style="margin-top: 2rem; color: #64748b; font-style: italic; font-size: 0.95rem;">
                "Setahun Menempa Sejarah — Bersama kami membangunkan ummah melalui kalam Allah."
            </p>
        </div>
    </section>

    <!-- 6 STRATEGIES SECTION -->
    <section id="features" style="padding: 6rem 1rem; background: #fff;">
        <div style="max-width: 1200px; margin: 0 auto; text-align: center;">
            <p style="text-transform: uppercase; letter-spacing: 0.1em; color: #6FC7CB; font-weight: 700; margin-bottom: 0.5rem;">Strategi Kami</p>
            <h2 style="font-size: 2.2rem; font-weight: 800; color: #5FB3B7; margin-bottom: 4rem;">6 Strategi Melahirkan Penghafaz Al-Quran Setahun</h2>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 2rem;">
                <!-- 1. MODUL MUDAH -->
                <div style="padding: 2rem; border-radius: 24px; background: #E8F6F7; text-align: left; transition: transform 0.3s; border: 1px solid #D1EEF0;">
                    <div style="font-size: 2rem; margin-bottom: 1rem;">📖</div>
                    <h3 style="font-size: 1.25rem; font-weight: 800; color: #5FB3B7; margin-bottom: 1rem;">MODUL MUDAH</h3>
                    <p style="color: #64748b; line-height: 1.6; font-size: 0.95rem;">Kaedah serta modul yang menarik dan atraktif dan mudah, terbukti berjaya membawa pelajar ke mercu kejayaan insya-Allah.</p>
                </div>

                <!-- 2. PENGURUSAN MASA -->
                <div style="padding: 2rem; border-radius: 24px; background: #fff; text-align: left; transition: transform 0.3s; border: 1px solid #f1f5f9; box-shadow: 0 10px 30px rgba(0,0,0,0.03);">
                    <div style="font-size: 2rem; margin-bottom: 1rem;">⏰</div>
                    <h3 style="font-size: 1.25rem; font-weight: 800; color: #5FB3B7; margin-bottom: 1rem;">PENGURUSAN MASA</h3>
                    <p style="color: #64748b; line-height: 1.6; font-size: 0.95rem;">Penggunaan kajian dan pengurusan pelajar yang sistematik untuk disiplin harian yang membantu mencapai Misi Hafiz Setahun.</p>
                </div>

                <!-- 3. PEMANTAPAN HAFALAN -->
                <div style="padding: 2rem; border-radius: 24px; background: #E8F6F7; text-align: left; transition: transform 0.3s; border: 1px solid #D1EEF0;">
                    <div style="font-size: 2rem; margin-bottom: 1rem;">🕋</div>
                    <h3 style="font-size: 1.25rem; font-weight: 800; color: #5FB3B7; margin-bottom: 1rem;">PEMANTAPAN HAFALAN</h3>
                    <p style="color: #64748b; line-height: 1.6; font-size: 0.95rem;">Melaksanakan &ldquo;6 rukun hafiz&rdquo; bagi menjaga kualiti bacaan dan hafalan dari hari pertama lagi.</p>
                </div>

                <!-- 4. PENGURUSAN PSIKOLOGI -->
                <div style="padding: 2rem; border-radius: 24px; background: #fff; text-align: left; transition: transform 0.3s; border: 1px solid #f1f5f9; box-shadow: 0 10px 30px rgba(0,0,0,0.03);">
                    <div style="font-size: 2rem; margin-bottom: 1rem;">🧠</div>
                    <h3 style="font-size: 1.25rem; font-weight: 800; color: #5FB3B7; margin-bottom: 1rem;">PSIKOLOGI MURABBIAH</h3>
                    <p style="color: #64748b; line-height: 1.6; font-size: 0.95rem;">Guru Huffaz terlatih mengamalkan psikologi pendidikan terkini & motivasi berpanjangan, tanpa hukuman fizikal.</p>
                </div>

                <!-- 5. PEMAKANAN SIHAT -->
                <div style="padding: 2rem; border-radius: 24px; background: #E8F6F7; text-align: left; transition: transform 0.3s; border: 1px solid #D1EEF0;">
                    <div style="font-size: 2rem; margin-bottom: 1rem;">🥗</div>
                    <h3 style="font-size: 1.25rem; font-weight: 800; color: #5FB3B7; margin-bottom: 1rem;">PEMAKANAN SIHAT</h3>
                    <p style="color: #64748b; line-height: 1.6; font-size: 0.95rem;">Pelajar memanfaatkan pemakanan Sunnah berkala untuk membantu kekuatan minda genius dan tubuh yang cergas.</p>
                </div>

                <!-- 6. REHAT MENCUKUPI -->
                <div style="padding: 2rem; border-radius: 24px; background: #fff; text-align: left; transition: transform 0.3s; border: 1px solid #f1f5f9; box-shadow: 0 10px 30px rgba(0,0,0,0.03);">
                    <div style="font-size: 2rem; margin-bottom: 1rem;">🌙</div>
                    <h3 style="font-size: 1.25rem; font-weight: 800; color: #5FB3B7; margin-bottom: 1rem;">REHAT MENCUKUPI</h3>
                    <p style="color: #64748b; line-height: 1.6; font-size: 0.95rem;">Penginapan selesa disediakan bagi memastikan pelajar mendapat rehat cukup untuk kekuatan minda menghafal Kalamullah.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- TESTIMONIALS SECTION -->
    <section id="testimonials" style="padding: 6rem 1rem; background: #fff;">
        <div style="max-width: 1100px; margin: 0 auto; text-align: center;">
            <p style="text-transform: uppercase; letter-spacing: 0.1em; color: #6FC7CB; font-weight: 700; margin-bottom: 0.5rem;">Apa Kata Mereka?</p>
            <h2 style="font-size: 2.2rem; font-weight: 800; color: #5FB3B7; margin-bottom: 3rem;">Testimoni Pelajar & Ibu Bapa</h2>
            
            <div style="border-radius: 32px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.06); border: 2px solid #f1f5f9;">
                <img src="/images/testimoni.png" alt="AKMAL Testimonials" style="width: 100%; height: auto; display: block;">
            </div>
            
            <div style="margin-top: 3rem; display: flex; justify-content: center; gap: 1rem;">
                <span style="width: 10px; height: 10px; border-radius: 50%; background: #6FC7CB; display: block;"></span>
                <span style="width: 10px; height: 10px; border-radius: 50%; background: #D1EEF0; display: block;"></span>
                <span style="width: 10px; height: 10px; border-radius: 50%; background: #D1EEF0; display: block;"></span>
            </div>
        </div>
    </section>

    <!-- ONLINE TAHFIZ PROGRAMS SECTION -->
    <section id="online-programs" style="padding: 6rem 1rem; background: #f1f5f9;">
        <div style="max-width: 1200px; margin: 0 auto; text-align: center;">
            <p style="text-transform: uppercase; letter-spacing: 0.1em; color: #6FC7CB; font-weight: 700; margin-bottom: 0.5rem;">Pembelajaran Digital</p>
            <h2 style="font-size: 2.5rem; font-weight: 800; color: #5FB3B7; margin-bottom: 4rem;">Program Tahfiz Online AKMAL</h2>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 2.5rem; align-items: stretch;">
                
                <!-- PREMIUM (FULL TIME) -->
                <div style="background: white; border-radius: 32px; padding: 3rem 2rem; border: 2px solid #5FB3B7; box-shadow: 0 25px 50px rgba(0,0,0,0.05); position: relative; display: flex; flex-direction: column;">
                    <div style="position: absolute; top: -20px; left: 50%; transform: translateX(-50%); background: #5FB3B7; color: white; padding: 0.5rem 1.5rem; border-radius: 999px; font-weight: 800; font-size: 0.8rem; letter-spacing: 0.1em;">FULL TIME</div>
                    <h3 style="font-size: 1.6rem; color: #1e293b; margin-bottom: 0.5rem; font-weight: 800;">AKMAL Tahfiz Online Premium</h3>
                    <p style="color: #64748b; font-size: 0.9rem; margin-bottom: 2rem;">Fokus khatam hafazan dalam tempoh singkat dengan bimbingan intensif.</p>
                    
                    <div style="text-align: left; margin-bottom: 2.5rem; flex-grow: 1;">
                        <ul style="list-style: none; padding: 0; display: flex; flex-direction: column; gap: 1rem; color: #4b5563; font-size: 0.95rem;">
                            <li style="display: flex; gap: 0.75rem;">✅ <span>Bermula 10 Tahun & Ke Atas (❌had umur)</span></li>
                            <li style="display: flex; gap: 0.75rem;">✅ <span>Lelaki & Perempuan</span></li>
                            <li style="display: flex; gap: 0.75rem;">✅ <span>6 Hari seminggu (Ahad – Jumaat)</span></li>
                            <li style="display: flex; gap: 0.75rem;">✅ <span>3 rukun (Sabaq, Sabqi, Manzil)</span></li>
                            <li style="display: flex; gap: 0.75rem;">✅ <span>Kelas secara Halaqah (10-12 Max 1 Guru)</span></li>
                            <li style="display: flex; gap: 0.75rem;">✅ <span>Perlu buat penangguhan sesi akademik</span></li>
                            <li style="display: flex; gap: 0.75rem;">⭐ <strong style="color: #5FB3B7;">Target Khatam Hafazan &lt; 1 Tahun</strong></li>
                        </ul>
                    </div>

                    <div style="background: #f8fafc; border-radius: 20px; padding: 1.5rem; border: 1px solid #e2e8f0;">
                        <p style="margin: 0; font-size: 0.8rem; color: #64748b; font-weight: 700; text-transform: uppercase;">Senarai Yuran</p>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem;">
                            <span style="font-size: 0.95rem; color: #1e293b; font-weight: 600;">Pendaftaran</span>
                            <span style="font-size: 1.25rem; color: #5FB3B7; font-weight: 800;">RM 1000</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.25rem;">
                            <span style="font-size: 0.95rem; color: #1e293b; font-weight: 600;">Bulanan</span>
                            <span style="font-size: 1.25rem; color: #5FB3B7; font-weight: 800;">RM 1050</span>
                        </div>
                    </div>
                </div>

                <!-- ELITE (PART TIME) -->
                <div style="background: white; border-radius: 32px; padding: 3rem 2rem; border: 1px solid #e2e8f0; box-shadow: 0 15px 30px rgba(0,0,0,0.03); display: flex; flex-direction: column;">
                    <div style="align-self: center; background: #e2f3f2; color: #5FB3B7; padding: 0.4rem 1.2rem; border-radius: 999px; font-weight: 800; font-size: 0.75rem; letter-spacing: 0.1em; margin-bottom: 2rem;">PART TIME</div>
                    <h3 style="font-size: 1.6rem; color: #1e293b; margin-bottom: 0.5rem; font-weight: 800;">AKMAL Tahfiz Online Elite</h3>
                    <p style="color: #64748b; font-size: 0.9rem; margin-bottom: 2rem;">Sesuai untuk pelajar dan dewasa yang mempunyai komitmen lain.</p>
                    
                    <div style="text-align: left; margin-bottom: 2.5rem; flex-grow: 1;">
                        <ul style="list-style: none; padding: 0; display: flex; flex-direction: column; gap: 1rem; color: #4b5563; font-size: 0.95rem;">
                            <li style="display: flex; gap: 0.75rem;">✅ <span>Bermula 10 Tahun & Ke Atas (❌had umur)</span></li>
                            <li style="display: flex; gap: 0.75rem;">✅ <span>Lelaki & Perempuan</span></li>
                            <li style="display: flex; gap: 0.75rem;">✅ <span>1 Kali Seminggu (1 Jam sesi kelas)</span></li>
                            <li style="display: flex; gap: 0.75rem;">✅ <span>Kelas secara One to One (1 Jam)</span></li>
                            <li style="display: flex; gap: 0.75rem;">✅ <span>Fokus hantar Tasmik hafalan harian</span></li>
                            <li style="display: flex; gap: 0.75rem;">📘 <span>Modul Murajaah disediakan</span></li>
                        </ul>
                    </div>

                    <div style="background: #f8fafc; border-radius: 20px; padding: 1.5rem; border: 1px solid #e2e8f0;">
                        <p style="margin: 0; font-size: 0.8rem; color: #64748b; font-weight: 700; text-transform: uppercase;">Senarai Yuran</p>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem;">
                            <span style="font-size: 0.95rem; color: #1e293b; font-weight: 600;">Pendaftaran</span>
                            <span style="font-size: 1.25rem; color: #64748b; font-weight: 800;">RM 300</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.25rem;">
                            <span style="font-size: 0.95rem; color: #1e293b; font-weight: 600;">Bulanan</span>
                            <span style="font-size: 1.25rem; color: #64748b; font-weight: 800;">RM 500</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </section>

    <!-- LOCATIONS SECTION -->
    <section id="locations" style="padding: 5rem 1rem; background: #f8fafc;">
        <div style="max-width: 1200px; margin: 0 auto; text-align: center;">
            <h2 style="font-size: 2.2rem; font-weight: 800; color: #5FB3B7; margin-bottom: 3rem;">Lokasi AKMAL</h2>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem;">
                <!-- 1. AKMAL PRIMA -->
                <div style="background: #fff; border-radius: 20px; padding: 1.5rem; box-shadow: 0 10px 25px rgba(0,0,0,0.05); text-align: left; display: flex; flex-direction: column; gap: 0.75rem; border: 1px solid #e2e8f0;">
                    <h3 style="margin: 0; font-size: 1.1rem; font-weight: 800; color: #6FC7CB;">AKMAL PRIMA</h3>
                    <p style="margin: 0; font-size: 0.85rem; color: #64748b; line-height: 1.5;">📍 NO1, Jalan Anggerik 2D/2, Prima Beruntung, 48300 Rawang, Selangor.</p>
                    <a href="https://www.google.com/maps/search/?api=1&query=AKMAL+PRIMA+Rawang+Selangor" target="_blank" style="margin-top: auto; display: inline-flex; align-items: center; gap: 0.5rem; color: #5FB3B7; font-weight: 700; font-size: 0.85rem; text-decoration: none; border: 1px solid #6FC7CB; padding: 0.5rem 1rem; border-radius: 999px; width: fit-content; transition: all 0.2s;">
                        Open in Maps <span style="font-size: 1rem;">↗</span>
                    </a>
                </div>

                <!-- 2. AKMAL SHAH ALAM -->
                <div style="background: #fff; border-radius: 20px; padding: 1.5rem; box-shadow: 0 10px 25px rgba(0,0,0,0.05); text-align: left; display: flex; flex-direction: column; gap: 0.75rem; border: 1px solid #e2e8f0;">
                    <h3 style="margin: 0; font-size: 1.1rem; font-weight: 800; color: #6FC7CB;">AKMAL SHAH ALAM</h3>
                    <p style="margin: 0; font-size: 0.85rem; color: #64748b; line-height: 1.5;">📍 No. 58, Jalan Kampung Tengah, 27/48, Taman Bunga Negara, 40400 Shah Alam, Selangor.</p>
                    <a href="https://www.google.com/maps/search/?api=1&query=AKMAL+SHAH+ALAM+Shah+Alam" target="_blank" style="margin-top: auto; display: inline-flex; align-items: center; gap: 0.5rem; color: #5FB3B7; font-weight: 700; font-size: 0.85rem; text-decoration: none; border: 1px solid #6FC7CB; padding: 0.5rem 1rem; border-radius: 999px; width: fit-content;">
                        Open in Maps ↗
                    </a>
                </div>

                <!-- 3. AKMAL BATU PAHAT -->
                <div style="background: #fff; border-radius: 20px; padding: 1.5rem; box-shadow: 0 10px 25px rgba(0,0,0,0.05); text-align: left; display: flex; flex-direction: column; gap: 0.75rem; border: 1px solid #e2e8f0;">
                    <h3 style="margin: 0; font-size: 1.1rem; font-weight: 800; color: #6FC7CB;">AKMAL BATU PAHAT</h3>
                    <p style="margin: 0; font-size: 0.85rem; color: #64748b; line-height: 1.5;">📍 No 38, jalan bandar baru 5, pusat bandar baru ayer hitam, 86100, ayer hitam, johor.</p>
                    <a href="https://www.google.com/maps/search/?api=1&query=AKMAL+BATU+PAHAT+Ayer+Hitam" target="_blank" style="margin-top: auto; display: inline-flex; align-items: center; gap: 0.5rem; color: #5FB3B7; font-weight: 700; font-size: 0.85rem; text-decoration: none; border: 1px solid #6FC7CB; padding: 0.5rem 1rem; border-radius: 999px; width: fit-content;">
                        Open in Maps ↗
                    </a>
                </div>

                <!-- 4. AKMAL HQ TERENGGANU -->
                <div style="background: #fff; border-radius: 20px; padding: 1.5rem; box-shadow: 0 10px 25px rgba(0,0,0,0.05); text-align: left; display: flex; flex-direction: column; gap: 0.75rem; border: 1px solid #e2e8f0;">
                    <h3 style="margin: 0; font-size: 1.1rem; font-weight: 800; color: #6FC7CB;">AKMAL HQ TERENGGANU</h3>
                    <p style="margin: 0; font-size: 0.85rem; color: #64748b; line-height: 1.5;">📍 Lot 2123, Kampung Tebakang Bukit Payung, 21400 Marang Terengganu.</p>
                    <a href="https://www.google.com/maps/search/?api=1&query=AKMAL+HQ+Marang+Terengganu" target="_blank" style="margin-top: auto; display: inline-flex; align-items: center; gap: 0.5rem; color: #5FB3B7; font-weight: 700; font-size: 0.85rem; text-decoration: none; border: 1px solid #6FC7CB; padding: 0.5rem 1rem; border-radius: 999px; width: fit-content;">
                        Open in Maps ↗
                    </a>
                </div>

                <!-- 5. AKMAL TAHFIZ ONLINE -->
                <div style="background: #fff; border-radius: 20px; padding: 1.5rem; box-shadow: 0 10px 25px rgba(0,0,0,0.05); text-align: left; display: flex; flex-direction: column; gap: 0.75rem; border: 1px solid #e2e8f0;">
                    <h3 style="margin: 0; font-size: 1.1rem; font-weight: 800; color: #6FC7CB;">AKMAL TAHFIZ ONLINE</h3>
                    <p style="margin: 0; font-size: 0.85rem; color: #64748b; line-height: 1.5;">📍 T171, Kampung Undang, 21600 Bukit Payong, Terengganu.</p>
                    <a href="https://www.google.com/maps/search/?api=1&query=AKMAL+Tahfiz+Online+Terengganu" target="_blank" style="margin-top: auto; display: inline-flex; align-items: center; gap: 0.5rem; color: #5FB3B7; font-weight: 700; font-size: 0.85rem; text-decoration: none; border: 1px solid #6FC7CB; padding: 0.5rem 1rem; border-radius: 999px; width: fit-content;">
                        Open in Maps ↗
                    </a>
                </div>

                <!-- 6. AKMAL NURUL AMAN -->
                <div style="background: #fff; border-radius: 20px; padding: 1.5rem; box-shadow: 0 10px 25px rgba(0,0,0,0.05); text-align: left; display: flex; flex-direction: column; gap: 0.75rem; border: 1px solid #e2e8f0;">
                    <h3 style="margin: 0; font-size: 1.1rem; font-weight: 800; color: #6FC7CB;">AKMAL NURUL AMAN</h3>
                    <p style="margin: 0; font-size: 0.85rem; color: #64748b; line-height: 1.5;">📍 Lot 112, Kg Bakong, Alor Pasir, 17000 Pasir Mas, Kelantan.</p>
                    <a href="https://www.google.com/maps/search/?api=1&query=AKMAL+Nurul+Aman+Kelantan" target="_blank" style="margin-top: auto; display: inline-flex; align-items: center; gap: 0.5rem; color: #5FB3B7; font-weight: 700; font-size: 0.85rem; text-decoration: none; border: 1px solid #6FC7CB; padding: 0.5rem 1rem; border-radius: 999px; width: fit-content;">
                        Open in Maps ↗
                    </a>
                </div>

                <!-- 7. AKMAL KLIA -->
                <div style="background: #fff; border-radius: 20px; padding: 1.5rem; box-shadow: 0 10px 25px rgba(0,0,0,0.05); text-align: left; display: flex; flex-direction: column; gap: 0.75rem; border: 1px solid #e2e8f0;">
                    <h3 style="margin: 0; font-size: 1.1rem; font-weight: 800; color: #6FC7CB;">AKMAL KLIA</h3>
                    <p style="margin: 0; font-size: 0.85rem; color: #64748b; line-height: 1.5;">📍 Lot 4846, Jalan Tembaga, Kampong Bukit Changgang, 42700 Banting, Selangor.</p>
                    <a href="https://www.google.com/maps/search/?api=1&query=AKMAL+KLIA+Banting" target="_blank" style="margin-top: auto; display: inline-flex; align-items: center; gap: 0.5rem; color: #5FB3B7; font-weight: 700; font-size: 0.85rem; text-decoration: none; border: 1px solid #6FC7CB; padding: 0.5rem 1rem; border-radius: 999px; width: fit-content;">
                        Open in Maps ↗
                    </a>
                </div>

                <!-- 8. AKMAL AR-RAHIMIYYAH -->
                <div style="background: #fff; border-radius: 20px; padding: 1.5rem; box-shadow: 0 10px 25px rgba(0,0,0,0.05); text-align: left; display: flex; flex-direction: column; gap: 0.75rem; border: 1px solid #e2e8f0;">
                    <h3 style="margin: 0; font-size: 1.1rem; font-weight: 800; color: #6FC7CB;">AKMAL AR-RAHIMIYYAH</h3>
                    <p style="margin: 0; font-size: 0.85rem; color: #64748b; line-height: 1.5;">📍 Lot 17524 kg Kuala sentul, 26500 maran, Pahang.</p>
                    <a href="https://www.google.com/maps/search/?api=1&query=AKMAL+Ar-Rahimiyyah+Maran+Pahang" target="_blank" style="margin-top: auto; display: inline-flex; align-items: center; gap: 0.5rem; color: #5FB3B7; font-weight: 700; font-size: 0.85rem; text-decoration: none; border: 1px solid #6FC7CB; padding: 0.5rem 1rem; border-radius: 999px; width: fit-content;">
                        Open in Maps ↗
                    </a>
                </div>

                <!-- 9. AKMAL PENANG -->
                <div style="background: #fff; border-radius: 20px; padding: 1.5rem; box-shadow: 0 10px 25px rgba(0,0,0,0.05); text-align: left; display: flex; flex-direction: column; gap: 0.75rem; border: 1px solid #e2e8f0;">
                    <h3 style="margin: 0; font-size: 1.1rem; font-weight: 800; color: #6FC7CB;">AKMAL PENANG</h3>
                    <p style="margin: 0; font-size: 0.85rem; color: #64748b; line-height: 1.5;">📍 SB 5878 Permatang Manggis 13300, 13100 Tasek Gelugor, Penang.</p>
                    <a href="https://www.google.com/maps/search/?api=1&query=AKMAL+Penang+Tasek+Gelugor" target="_blank" style="margin-top: auto; display: inline-flex; align-items: center; gap: 0.5rem; color: #5FB3B7; font-weight: 700; font-size: 0.85rem; text-decoration: none; border: 1px solid #6FC7CB; padding: 0.5rem 1rem; border-radius: 999px; width: fit-content;">
                        Open in Maps ↗
                    </a>
                </div>
            </div>
        </div>
    </section>



    <!-- TESTIMONI -->
    <section id="testimoni" style="padding: 80px 1rem; background: #f8fafc;">
        <div style="max-width: 1200px; margin: 0 auto; text-align: center;">
            <h2 style="font-size: 2.5rem; font-weight: 800; color: #6FC7CB; margin-bottom: 1rem;">Testimoni Pelajar & Ibu Bapa</h2>
            <p style="color: #64748b; max-width: 600px; margin: 0 auto 3rem;">Apa kata komuniti kami tentang pengalaman mereka di Akademi Al-Quran Amalillah.</p>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem;">
                <div style="background: white; padding: 2.5rem; border-radius: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); text-align: left; position: relative;">
                    <span style="font-size: 4rem; position: absolute; top: 10px; right: 20px; color: #f1f5f9; font-family: serif; line-height: 1;">&rdquo;</span>
                    <p style="color: #4b5563; font-style: italic; line-height: 1.7; margin-bottom: 1.5rem;">"Sistem pengurusan yang sangat sistematik. Saya boleh pantau kemajuan hafazan anak saya setiap hari melalui dashboard parent. AI Ramalan sangat membantu!"</p>
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <div style="width: 45px; height: 45px; border-radius: 50%; background: #6FC7CB; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">H</div>
                        <div>
                            <h4 style="font-size: 1rem; font-weight: 700; margin: 0;">Hassan bin Ahmad</h4>
                            <p style="font-size: 0.85rem; color: #94a3b8; margin: 0;">Ibu Bapa</p>
                        </div>
                    </div>
                </div>
                
                <div style="background: white; padding: 2.5rem; border-radius: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); text-align: left; position: relative;">
                    <span style="font-size: 4rem; position: absolute; top: 10px; right: 20px; color: #f1f5f9; font-family: serif; line-height: 1;">&rdquo;</span>
                    <p style="color: #4b5563; font-style: italic; line-height: 1.7; margin-bottom: 1.5rem;">"Alhamdulillah, teknik pengajaran Murabbi di sini sangat moden. Anak saya lebih bersemangat untuk menghafaz dengan adanya sistem ranking dan gamifikasi."</p>
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <div style="width: 45px; height: 45px; border-radius: 50%; background: #6FC7CB; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">A</div>
                        <div>
                            <h4 style="font-size: 1rem; font-weight: 700; margin: 0;">Aminah binti Saleh</h4>
                            <p style="font-size: 0.85rem; color: #94a3b8; margin: 0;">Ibu Bapa</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- LOCATION & CONTACT -->
    <section id="contact" style="padding: 80px 1rem; background: white;">
        <div style="max-width: 1200px; margin: 0 auto;">
            <div style="display: grid; grid-template-columns: 1fr 1.2fr; gap: 4rem; align-items: start;">
                <div>
                    <h2 style="font-size: 2.5rem; font-weight: 800; color: #6FC7CB; margin-bottom: 1.5rem;">Hubungi Kami</h2>
                    <p style="color: #4b5563; margin-bottom: 2.5rem; line-height: 1.7;">Sertai komuniti kami untuk membina generasi Al-Quran yang cemerlang. Kami sedia membantu anda melalui pelbagai saluran komunikasi.</p>
                    
                    <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                        <div style="display: flex; gap: 1rem;">
                            <div style="width: 40px; height: 40px; background: #E8F6F7; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">📍</div>
                            <div>
                                <h4 style="margin: 0; font-weight: 700;">Lokasi</h4>
                                <p style="margin: 0.25rem 0 0; color: #64748b; font-size: 0.9rem;">Lot 2123, Kampung Tebakang Bukit Payung, 21400 Marang, Terengganu</p>
                            </div>
                        </div>
                        <div style="display: flex; gap: 1rem;">
                            <div style="width: 40px; height: 40px; background: #E8F6F7; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">📞</div>
                            <div>
                                <h4 style="margin: 0; font-weight: 700;">Telefon</h4>
                                <p style="margin: 0.25rem 0 0; color: #64748b; font-size: 0.9rem;">+60 11-1987 4963</p>
                            </div>
                        </div>
                        <div style="display: flex; gap: 1rem;">
                            <div style="width: 40px; height: 40px; background: #E8F6F7; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">✉️</div>
                            <div>
                                <h4 style="margin: 0; font-weight: 700;">Emel</h4>
                                <p style="margin: 0.25rem 0 0; color: #64748b; font-size: 0.9rem;">info@akmal.edu.my</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div style="border-radius: 32px; overflow: hidden; height: 400px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); border: 8px solid white;">
                    <iframe 
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3972.637!2d103.091!3d5.234!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31b79f8263795b5b%3A0xe9f796d119c4d!2sAkademi%20Al-Quran%20Amalillah!5e0!3m2!1sen!2smy!4v1713750000000!5m2!1sen!2smy" 
                        width="100%" height="100%" style="border:0;" allowfullscreen="" loading="lazy"></iframe>
                </div>
            </div>
        </div>
    </section>

    <!-- FOOTER -->
    <footer style="background: #0f172a; color: white; padding: 60px 1rem 20px;">
        <div style="max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 3rem; margin-bottom: 40px;">
            <div>
                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem;">
                    <img src="/images/logo.png" alt="Logo" style="height: 45px;">
                    <div style="display: flex; flex-direction: column;">
                        <span style="font-weight: 800; font-size: 1.2rem; letter-spacing: -0.02em;">AKMAL</span>
                        <span style="font-size: 0.65rem; color: #94a3b8; font-weight: 600;">Universiti Sains Islam Malaysia</span>
                    </div>
                </div>
                <p style="color: #94a3b8; font-size: 0.85rem; line-height: 1.6;">Akademi Al-Quran Amalillah dengan kerjasama Universiti Sains Islam Malaysia komited dalam membina generasi Al-Quran yang cemerlang.</p>
            </div>
            <div>
                <h4 style="font-weight: 700; margin-bottom: 1.5rem; font-size: 1rem;">Navigasi</h4>
                <ul style="list-style: none; padding: 0; display: flex; flex-direction: column; gap: 0.75rem; font-size: 0.9rem; color: #94a3b8;">
                    <li><a href="#" style="color: inherit; transition: color 0.2s;">Utama</a></li>
                    <li><a href="#testimoni" style="color: inherit; transition: color 0.2s;">Testimoni</a></li>
                    <li><a href="#contact" style="color: inherit; transition: color 0.2s;">Hubungi</a></li>
                </ul>
            </div>
        </div>
        <div style="max-width: 1200px; margin: 0 auto; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.05); text-align: center; color: #64748b; font-size: 0.75rem;">
            &copy; 2024 Akademi Al-Quran Amalillah (AKMAL) — Kerjasama Universiti Sains Islam Malaysia.
        </div>
    </footer>
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const navToggle = document.getElementById('navToggle');
            const navbar = document.querySelector('.navbar');
            
            navToggle.addEventListener('click', () => {
                navbar.classList.toggle('active');
                navToggle.classList.toggle('active');
            });
            
            // Close menu when a link is clicked
            const navLinks = document.querySelectorAll('.nav-links a');
            navLinks.forEach(link => {
                link.addEventListener('click', () => {
                    navbar.classList.remove('active');
                    navToggle.classList.remove('active');
                });
            });
        });
    </script>
</body>
</html>

