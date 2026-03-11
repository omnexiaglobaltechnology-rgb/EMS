const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../../models/User');
const { signAccessToken } = require('../../utils/jwt');
const { validateRegisterInput, validateLoginInput, validateVerificationToken } = require('./auth.validation');
const TimeLog = require('../../models/TimeLog');
const { getISTTime } = require('../../utils/time');

const VERIFICATION_TOKEN_TTL_MINUTES = Number(process.env.EMAIL_VERIFICATION_TOKEN_TTL_MINUTES || 30);

const toPublicUser = (user) => ({
	id: user.id,
	email: user.email,
	name: user.name,
	role: user.role || 'intern',
	isEmailVerified: Boolean(user.isEmailVerified),
	createdAt: user.createdAt,
	updatedAt: user.updatedAt
});

const buildAuthResponse = (user) => {
	const safeUser = toPublicUser(user);
	const token = signAccessToken({
		id: safeUser.id,
		email: safeUser.email,
		role: safeUser.role
	});

	return { token, user: safeUser };
};

const buildEmailVerificationState = () => {
	const verificationToken = crypto.randomBytes(32).toString('hex');
	const emailVerificationTokenHash = crypto
		.createHash('sha256')
		.update(verificationToken)
		.digest('hex');
	const emailVerificationExpiresAt = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MINUTES * 60 * 1000);

	return {
		verificationToken,
		emailVerificationTokenHash,
		emailVerificationExpiresAt
	};
};

const register = async (payload) => {
	const { email, password, name, role } = validateRegisterInput(payload);

	const existingUser = await User.findOne({ email });
	if (existingUser) {
		const isAlreadyVerified = existingUser.isEmailVerified !== false;
		if (isAlreadyVerified) throw new Error('Email is already registered');

		const { verificationToken, emailVerificationTokenHash, emailVerificationExpiresAt } =
			buildEmailVerificationState();
		existingUser.emailVerificationTokenHash = emailVerificationTokenHash;
		existingUser.emailVerificationExpiresAt = emailVerificationExpiresAt;
		await existingUser.save();

		return {
			message: 'Account exists but email is not verified. Use the new verification token.',
			requiresEmailVerification: true,
			email,
			...(process.env.NODE_ENV !== 'production' ? { verificationToken } : {})
		};
	}

	const hashedPassword = await bcrypt.hash(password, 10);
	const { verificationToken, emailVerificationTokenHash, emailVerificationExpiresAt } = buildEmailVerificationState();

	await User.create({
		email,
		name,
		role,
		password: hashedPassword,
		authProvider: 'local',
		isEmailVerified: false,
		emailVerificationTokenHash,
		emailVerificationExpiresAt
	});

	return {
		message: 'Registration successful. Verify your email before logging in.',
		requiresEmailVerification: true,
		email,
		...(process.env.NODE_ENV !== 'production' ? { verificationToken } : {})
	};
};

const login = async (payload, ipAddress, userAgent) => {
	const { email, password } = validateLoginInput(payload);

	const user = await User.findOne({ email });
	if (!user) throw new Error('Invalid email or password');
	if (user.authProvider && user.authProvider !== 'local') {
		throw new Error('Third-party accounts are not allowed');
	}
	if (!user.password) throw new Error('Invalid email or password');

	const isValidPassword = await bcrypt.compare(password, user.password);
	if (!isValidPassword) throw new Error('Invalid email or password');
	const isEmailVerified = user.isEmailVerified !== false;
	if (!isEmailVerified) {
		throw new Error('Email is not verified. Please verify your email first.');
	}

	// Record login time
	try {
		const loginAt = getISTTime();
		const { toISTISOString } = require('../../utils/time');
		await TimeLog.create({
			userId: user._id,
			userName: user.name,
			userRole: user.role || 'intern',
			loginTimeIST: toISTISOString(loginAt),
			ipAddress,
			userAgent,
			isActive: true,
			createdAtIST: toISTISOString(loginAt)
		});
	} catch (error) {
		console.error('[auth-service] Failed to record login time:', error.message);
		// Don't fail the login if time tracking fails
	}

	return buildAuthResponse(user);
};

const verifyEmail = async (payload) => {
	const token = validateVerificationToken(payload?.token);
	const emailVerificationTokenHash = crypto
		.createHash('sha256')
		.update(token)
		.digest('hex');

	const user = await User.findOne({
		emailVerificationTokenHash,
		emailVerificationExpiresAt: { $gt: new Date() }
	});

	if (!user) {
		throw new Error('Verification token is invalid or expired');
	}

	user.isEmailVerified = true;
	user.emailVerificationTokenHash = null;
	user.emailVerificationExpiresAt = null;
	await user.save();

	return {
		message: 'Email verified successfully. You can now log in.',
		user: toPublicUser(user)
	};
};

const getMe = async (userId) => {
	const user = await User.findById(userId);
	if (!user) throw new Error('User not found');
	return toPublicUser(user);
};

module.exports = {
	register,
	login,
	verifyEmail,
	getMe
};
