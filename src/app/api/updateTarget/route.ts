import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

export async function POST(request: NextRequest) {
  const data = await request.json();
  const { login, planId, targetId, achieved, achievedDate } = data;

  if (!login || !planId || !targetId || achieved === undefined) {
    return NextResponse.json(
      { error: 'Недостаточно данных для обновления цели' },
      { status: 400 }
    );
  }

  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');

  try {
    await client.connect();
    const db = client.db('users');

    // Получаем текущего пользователя и его планы
    const user = await db.collection('users').findOne(
      { user: login },
      { projection: { plans: 1 } }
    );

    if (!user || !user.plans) {
      return NextResponse.json(
        { error: 'Пользователь или планы не найдены' },
        { status: 404 }
      );
    }

    // Находим нужный план и обновляем цель
    const updatedPlans = user.plans.map((plan: any) => {
      if (plan.id === planId && plan.targets) {
        const updatedTargets = plan.targets.map((target: any) => {
          if (target.id === targetId) {
            return {
              ...target,
              achieved,
              achievedDate: achieved ? new Date(achievedDate) : null
            };
          }
          return target;
        });
        return { ...plan, targets: updatedTargets };
      }
      return plan;
    });

    // Обновляем планы в базе данных
    const result = await db.collection('users').updateOne(
      { user: login },
      { $set: { plans: updatedPlans } }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: 'Не удалось обновить цель' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Цель успешно обновлена' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Ошибка при обновлении цели:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
} 