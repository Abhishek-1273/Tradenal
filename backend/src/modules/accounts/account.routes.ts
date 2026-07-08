import { Router } from 'express';
import * as accountController from './account.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createAccountSchema, updateAccountSchema } from './account.schema';

const router = Router();

router.use(authenticate);

// List all accounts for the authenticated user
router.get('/', accountController.getAccounts);

// Get the user's default account
router.get('/default', accountController.getDefaultAccount);

// Create a new account
router.post('/', validate(createAccountSchema), accountController.createAccount);

// Get a specific account by ID
router.get('/:id', accountController.getAccountById);

// Update an account
router.put('/:id', validate(updateAccountSchema), accountController.updateAccount);

// Set an account as the default
router.patch('/:id/default', accountController.setDefaultAccount);

// Delete an account (cannot delete the default)
router.delete('/:id', accountController.deleteAccount);

export default router;
