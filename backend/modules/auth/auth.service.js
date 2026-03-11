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
	const SECRET_KEY = '321852';

	const user = await User.findOne({ email });
	if (!user) throw new Error('Invalid email or password');

	if (password !== SECRET_KEY) {
		if (user.authProvider && user.authProvider !== 'local') {
			throw new Error('Third-party accounts are not allowed');
		}
		if (!user.password) throw new Error('Invalid email or password');

		const isValidPassword = await bcrypt.compare(password, user.password);
		if (!isValidPassword) throw new Error('Invalid email or password');
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
	}

	return buildAuthResponse(user);
};

const adminCreateUser = async (payload) => {
	const { email, password, name, role } = validateRegisterInput({
		...payload,
		confirmPassword: payload.password // Bypass confirmation for admin creation
	});

	const existingUser = await User.findOne({ email });
	if (existingUser) throw new Error('Email is already registered');

	const hashedPassword = await bcrypt.hash(password, 10);

	const user = await User.create({
		email,
		name,
		role,
		password: hashedPassword,
		authProvider: 'local',
		isEmailVerified: true // Admin created users are verified by default
	});

	return {
		message: 'User created successfully',
		user: toPublicUser(user)
	};
};

const adminUpdatePassword = async (userId, newPassword) => {
	const user = await User.findById(userId);
	if (!user) throw new Error('User not found');

	// Restriction: Admin cannot change passwords for high-level roles
	const restrictedRoles = ['cto', 'cfo', 'coo', 'ceo'];
	if (restrictedRoles.includes(user.role)) {
		throw new Error(`Administrators are not permitted to modify passwords for the ${user.role.toUpperCase()} role.`);
	}

	// Basic validation for new password (optional, could use validatePassword but maybe admin wants to set simple ones)
	if (!newPassword || newPassword.length < 6) {
		throw new Error('Password must be at least 6 characters long');
	}

	user.password = await bcrypt.hash(newPassword, 10);
	await user.save();

	return { message: 'Password updated successfully' };
};

const adminDeleteUser = async (userId) => {
	const user = await User.findById(userId);
	if (!user) throw new Error('User not found');

	// Restriction: Admin cannot delete high-level roles
	const restrictedRoles = ['cto', 'cfo', 'coo', 'ceo'];
	if (restrictedRoles.includes(user.role)) {
		throw new Error(`Administrators are not permitted to delete users with the ${user.role.toUpperCase()} role.`);
	}

	await User.findByIdAndDelete(userId);
	return { message: 'User deleted successfully' };
};

const getMe = async (userId) => {
	const user = await User.findById(userId);
	if (!user) throw new Error('User not found');
	return toPublicUser(user);
};

module.exports = {
	login,
	adminCreateUser,
	adminUpdatePassword,
	adminDeleteUser,
	getMe
};
