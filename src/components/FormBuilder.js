import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Formik, FieldArray } from 'formik';
import * as Yup from 'yup';
import './FormBuilder.css';

const FormBuilder = () => {
    const [activeTab, setActiveTab] = useState('builder');
    const [previewMode, setPreviewMode] = useState(false);
    const [availableBudgetItems] = useState([
        { id: '1', name: 'Rubrica de Manutenção', value: 50000 },
        { id: '2', name: 'Rubrica de Desenvolvimento', value: 100000 }
    ]);

    const initialValues = {
        formTitle: '',
        formDescription: '',
        requiresLogin: true,
        fields: [],
        accessRoles: [],
        isActive: true
    };

    const validationSchema = Yup.object().shape({
        formTitle: Yup.string().required('Título do formulário é obrigatório'),
        formDescription: Yup.string(),
        fields: Yup.array().min(1, 'Adicione pelo menos um campo ao formulário')
    });

    const fieldTypes = [
        { value: 'text', label: 'Texto' },
        { value: 'textarea', label: 'Área de Texto' },
        { value: 'number', label: 'Número' },
        { value: 'date', label: 'Data' },
        { value: 'select', label: 'Seleção' },
        { value: 'checkbox', label: 'Checkbox' },
        { value: 'radio', label: 'Radio Button' },
        { value: 'file', label: 'Upload de Arquivo' },
        { value: 'payment_request', label: 'Solicitação de Pagamento' },
        { value: 'commitment', label: 'Empenho' }
    ];

    const handleSubmit = async (values) => {
        try {
            const response = await fetch('/api/forms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values)
            });
            const data = await response.json();
            alert(`Formulário salvo com ID: ${data.id}`);
        } catch (error) {
            console.error('Erro ao salvar:', error);
            alert('Erro ao salvar formulário');
        }
    };

    const createNewField = (type) => {
        const baseField = {
            id: `field-${Date.now()}`,
            type,
            label: '',
            required: false,
            placeholder: '',
        };

        switch (type) {
            case 'select':
            case 'radio':
            case 'checkbox':
                return { ...baseField, options: ['Opção 1', 'Opção 2'] };
            case 'payment_request':
                return { ...baseField, label: 'Solicitação de Pagamento', budgetItems: availableBudgetItems.map(item => item.id), required: true };
            case 'commitment':
                return { ...baseField, label: 'Empenho', budgetItems: availableBudgetItems.map(item => item.id), required: true, reasonLabel: 'Motivo' };
            default:
                return baseField;
        }
    };

    const renderFieldEditor = (field, index, values, setFieldValue) => {
        const commonProps = {
            className: 'field-option-input',
            onChange: (e) => setFieldValue(`fields[${index}].${e.target.name}`, e.target.value),
        };

        return (
            <div className="field-editor-content">
                <div className="field-option">
                    <label>Rótulo:</label>
                    <input type="text" name="label" value={field.label} {...commonProps} />
                </div>

                <div className="field-option">
                    <label>
                        <input
                            type="checkbox"
                            name="required"
                            checked={field.required}
                            onChange={(e) => setFieldValue(`fields[${index}].required`, e.target.checked)}
                        />
                        Campo obrigatório
                    </label>
                </div>

                {['text', 'textarea', 'number', 'date'].includes(field.type) && (
                    <div className="field-option">
                        <label>Placeholder:</label>
                        <input type="text" name="placeholder" value={field.placeholder || ''} {...commonProps} />
                    </div>
                )}

                {['select', 'radio', 'checkbox'].includes(field.type) && (
                    <FieldArray name={`fields[${index}].options`}>
                        {({ push, remove }) => (
                            <div className="field-options-editor">
                                <label>Opções:</label>
                                {field.options.map((option, optionIndex) => (
                                    <div key={optionIndex} className="option-item">
                                        <input
                                            type="text"
                                            value={option}
                                            onChange={(e) => setFieldValue(`fields[${index}].options[${optionIndex}]`, e.target.value)}
                                        />
                                        <button type="button" onClick={() => remove(optionIndex)}>×</button>
                                    </div>
                                ))}
                                <button type="button" onClick={() => push('Nova Opção')}>+ Adicionar</button>
                            </div>
                        )}
                    </FieldArray>
                )}

                {['payment_request', 'commitment'].includes(field.type) && (
                    <div className="field-option">
                        <label>Rubricas Vinculadas:</label>
                        <div className="budget-items-list">
                            {availableBudgetItems.map(item => (
                                <label key={item.id}>
                                    <input
                                        type="checkbox"
                                        checked={field.budgetItems?.includes(item.id) || false}
                                        onChange={(e) => {
                                            const newItems = e.target.checked
                                                ? [...(field.budgetItems || []), item.id]
                                                : field.budgetItems?.filter(id => id !== item.id);
                                            setFieldValue(`fields[${index}].budgetItems`, newItems);
                                        }}
                                    />
                                    {item.name} (R$ {item.value.toLocaleString('pt-BR')})
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                {field.type === 'commitment' && (
                    <div className="field-option">
                        <label>Texto do Motivo:</label>
                        <input type="text" name="reasonLabel" value={field.reasonLabel || 'Motivo'} {...commonProps} />
                    </div>
                )}
            </div>
        );
    };

    const renderPreviewField = (field) => {
        switch (field.type) {
            case 'text': return <input type="text" placeholder={field.placeholder} disabled />;
            case 'textarea': return <textarea placeholder={field.placeholder} disabled />;
            case 'number': return <input type="number" placeholder={field.placeholder} disabled />;
            case 'date': return <input type="date" disabled />;
            case 'select': return (
                <select disabled>
                    {field.options.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                </select>
            );
            case 'checkbox': case 'radio': return (
                <div className={`${field.type}-options`}>
                    {field.options.map((opt, i) => (
                        <label key={i}>
                            <input type={field.type} name={`field-${field.id}`} disabled />
                            {opt}
                        </label>
                    ))}
                </div>
            );
            case 'file': return <input type="file" disabled />;
            case 'payment_request': return (
                <div className="payment-field">
                    <select disabled>
                        <option>Selecione uma rubrica</option>
                        {field.budgetItems?.map(id => {
                            const item = availableBudgetItems.find(i => i.id === id);
                            return item && <option key={id} value={id}>{item.name}</option>;
                        })}
                    </select>
                    <input type="number" placeholder="Valor" disabled />
                </div>
            );
            case 'commitment': return (
                <div className="commitment-field">
                    <select disabled>
                        <option>Selecione uma rubrica</option>
                        {field.budgetItems?.map(id => {
                            const item = availableBudgetItems.find(i => i.id === id);
                            return item && <option key={id} value={id}>{item.name}</option>;
                        })}
                    </select>
                    <input type="number" placeholder="Valor" disabled />
                    <textarea placeholder={field.reasonLabel || 'Motivo'} disabled />
                </div>
            );
            default: return <input type="text" disabled />;
        }
    };

    return (
        <div className="form-builder-container">
            <div className="form-builder-header">
                <h2>Criador de Modelos de Formulários</h2>
                <div className="tabs">
                    <button
                        className={activeTab === 'builder' ? 'active' : ''}
                        onClick={() => setActiveTab('builder')}
                    >
                        Construtor
                    </button>
                    <button
                        className={activeTab === 'settings' ? 'active' : ''}
                        onClick={() => setActiveTab('settings')}
                    >
                        Configurações
                    </button>
                    <button
                        className={activeTab === 'access' ? 'active' : ''}
                        onClick={() => setActiveTab('access')}
                    >
                        Controle de Acesso
                    </button>
                </div>
            </div>

            <Formik
                initialValues={initialValues}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
            >
                {({ values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue }) => (
                    <form onSubmit={handleSubmit}>
                        {activeTab === 'builder' && (
                            <div className="form-builder-tab">
                                <div className="form-preview">
                                    {previewMode ? (
                                        <div className="preview-mode">
                                            <h3>{values.formTitle || 'Pré-visualização do Formulário'}</h3>
                                            <p>{values.formDescription}</p>
                                            {values.fields.map((field, index) => (
                                                <div key={field.id} className="form-field">
                                                    <label>
                                                        {field.label}
                                                        {field.required && <span className="required-asterisk">*</span>}
                                                    </label>
                                                    {renderPreviewField(field, index)}
                                                </div>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={() => setPreviewMode(false)}
                                                className="preview-toggle-button"
                                            >
                                                Voltar para Edição
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="edit-mode">
                                            <div className="form-header">
                                                <input
                                                    type="text"
                                                    name="formTitle"
                                                    placeholder="Título do Formulário"
                                                    value={values.formTitle}
                                                    onChange={handleChange}
                                                    onBlur={handleBlur}
                                                    className={errors.formTitle && touched.formTitle ? 'error' : ''}
                                                />
                                                {errors.formTitle && touched.formTitle && (
                                                    <div className="error-message">{errors.formTitle}</div>
                                                )}
                                                <textarea
                                                    name="formDescription"
                                                    placeholder="Descrição do Formulário"
                                                    value={values.formDescription}
                                                    onChange={handleChange}
                                                    onBlur={handleBlur}
                                                />
                                            </div>

                                            <FieldArray name="fields">
                                                {({ push, remove, move }) => (
                                                    <>
                                                        <DragDropContext
                                                            onDragEnd={({ destination, source }) => {
                                                                if (destination) {
                                                                    move(source.index, destination.index);
                                                                }
                                                            }}
                                                        >
                                                            <Droppable droppableId="formFields">
                                                                {(provided) => (
                                                                    <div
                                                                        {...provided.droppableProps}
                                                                        ref={provided.innerRef}
                                                                        className="form-fields-container"
                                                                    >
                                                                        {values.fields.map((field, index) => (
                                                                            <Draggable
                                                                                key={field.id}
                                                                                draggableId={field.id}
                                                                                index={index}
                                                                            >
                                                                                {(provided, snapshot) => (
                                                                                    <div
                                                                                        ref={provided.innerRef}
                                                                                        {...provided.draggableProps}
                                                                                        className={`form-field-editor ${snapshot.isDragging ? 'is-dragging' : ''}`}
                                                                                    >
                                                                                        <div className="field-header" {...provided.dragHandleProps}>
                                                                                            <span className="drag-handle">☰</span>
                                                                                            <h4>{fieldTypes.find(ft => ft.value === field.type)?.label}</h4>
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={() => remove(index)}
                                                                                                className="remove-field"
                                                                                            >
                                                                                                ×
                                                                                            </button>
                                                                                        </div>
                                                                                        {renderFieldEditor(field, index, values, setFieldValue)}
                                                                                    </div>
                                                                                )}
                                                                            </Draggable>
                                                                        ))}
                                                                        {provided.placeholder}
                                                                    </div>
                                                                )}
                                                            </Droppable>
                                                        </DragDropContext>

                                                        <div className="add-field-section">
                                                            <select
                                                                id="newFieldType"
                                                                className="field-type-selector"
                                                                defaultValue="text"
                                                            >
                                                                {fieldTypes.map(type => (
                                                                    <option key={type.value} value={type.value}>
                                                                        {type.label}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const type = document.getElementById('newFieldType').value;
                                                                    push(createNewField(type));
                                                                }}
                                                                className="add-field-button"
                                                            >
                                                                Adicionar Campo
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </FieldArray>
                                        </div>
                                    )}
                                </div>
                                <div className="form-actions">
                                    <button
                                        type="button"
                                        onClick={() => setPreviewMode(!previewMode)}
                                        className="preview-toggle-button"
                                    >
                                        {previewMode ? 'Continuar Editando' : 'Pré-visualizar'}
                                    </button>
                                    <button
                                        type="submit"
                                        className="save-form-button"
                                        disabled={!!errors.formTitle || values.fields.length === 0}
                                    >
                                        Salvar Modelo
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'settings' && (
                            <div className="form-settings-tab">
                                <h3>Configurações do Formulário</h3>
                                <div className="setting-item">
                                    <label>
                                        <input
                                            type="checkbox"
                                            name="requiresLogin"
                                            checked={values.requiresLogin}
                                            onChange={handleChange}
                                        />
                                        Requer login para acessar
                                    </label>
                                </div>
                                <div className="setting-item">
                                    <label>
                                        <input
                                            type="checkbox"
                                            name="isActive"
                                            checked={values.isActive !== false}
                                            onChange={(e) => setFieldValue('isActive', e.target.checked)}
                                        />
                                        Formulário ativo
                                    </label>
                                </div>
                            </div>
                        )}

                        {activeTab === 'access' && (
                            <div className="form-access-tab">
                                <h3>Controle de Acesso</h3>
                                <p>Selecione quais perfis podem acessar:</p>
                                <div className="access-roles">
                                    {['Administrador', 'Financeiro', 'Usuário Comum'].map(role => (
                                        <label key={role}>
                                            <input
                                                type="checkbox"
                                                checked={values.accessRoles.includes(role)}
                                                onChange={(e) => {
                                                    const newRoles = e.target.checked
                                                        ? [...values.accessRoles, role]
                                                        : values.accessRoles.filter(r => r !== role);
                                                    setFieldValue('accessRoles', newRoles);
                                                }}
                                            />
                                            {role}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </form>
                )}
            </Formik>
        </div>
    );
};

export default FormBuilder;